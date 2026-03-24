/**
 * 编排层：单次查库 → 邮件/短信双通道发送 → 批量回写 send_time
 */
'use strict';

const { getEligibleTargets } = require('./query');
const { createTransporter, sendPlanEmail } = require('./mail');
const { sendPlanSms } = require('./sms');
const { mapWithConcurrency } = require('./concurrency');

/** 邮件并行用户数上限；可通过环境变量 EMAIL_SEND_CONCURRENCY 调整（默认 3，避免 SMTP 连数过高） */
const EMAIL_SEND_CONCURRENCY = Math.max(
	1,
	Number.parseInt(process.env.EMAIL_SEND_CONCURRENCY || '3', 10) || 3
);

/** 短信并行用户数上限，避免触发平台 QPS；可通过环境变量 SMS_SEND_CONCURRENCY 调整（默认 3） */
const SMS_SEND_CONCURRENCY = Math.max(
	1,
	Number.parseInt(process.env.SMS_SEND_CONCURRENCY || '3', 10) || 3
);

/**
 * 执行完整发送流程（邮件 + 短信）
 * @param {object} db - uniCloud 数据库实例
 * @param {number} now - 当前时间戳
 * @returns {Promise<object>}
 */
async function runFullFlow(db, now) {
	const { emailTargets, smsTargets, allCandidateIds } = await getEligibleTargets(db, now);

	if (allCandidateIds.length === 0) {
		return { processed: 0, message: '无符合发送条件的用户' };
	}

	let emailResults = [];
	let transporter = null;
	if (emailTargets.length > 0) {
		transporter = createTransporter();
		if (transporter) {
			emailResults = await mapWithConcurrency(
				emailTargets,
				EMAIL_SEND_CONCURRENCY,
				(user) => sendPlanEmail(transporter, user)
			);
		} else {
			console.warn('SMTP 未配置，跳过邮件发送');
		}
	}

	const smsResults =
		smsTargets.length === 0
			? []
			: await mapWithConcurrency(smsTargets, SMS_SEND_CONCURRENCY, (user) => sendPlanSms(user));

	/** 仅当某通道实际发送成功时才清除 send_time，避免「未发出却清空」导致后续永远查不到人 */
	const idsToClear = new Set();
	if (transporter) {
		for (let i = 0; i < emailResults.length; i++) {
			const r = emailResults[i];
			if (r && r.sendOk && r.emails > 0) idsToClear.add(r.uid);
		}
	}
	for (let i = 0; i < smsResults.length; i++) {
		const r = smsResults[i];
		if (r && r.sendOk && r.phones > 0) idsToClear.add(r.uid);
	}

	try {
		if (idsToClear.size > 0) {
			const _ = db.command;
			await db.collection('uni-id-users')
				.where({ _id: _.in([...idsToClear]) })
				.update({ send_time: null });
		}
	} catch (e) {
		console.error('批量更新 send_time 失败', e);
	}

	return {
		processed: allCandidateIds.length,
		email: { count: emailResults.length, results: emailResults },
		sms: { count: smsResults.length, results: smsResults }
	};
}

/**
 * 仅查询模式：返回双通道命中统计与样例，不发送不写库
 * @param {object} db - uniCloud 数据库实例
 * @param {number} now - 当前时间戳
 * @returns {Promise<object>}
 */
async function runDryRun(db, now) {
	const { emailTargets, smsTargets, allCandidateIds } = await getEligibleTargets(db, now);
	return {
		dryRun: true,
		totalCandidates: allCandidateIds.length,
		email: {
			count: emailTargets.length,
			samples: emailTargets.slice(0, 5).map(u => ({
				_id: u._id,
				send_display_name: u.send_display_name,
				send_emails: u.send_emails
			}))
		},
		sms: {
			count: smsTargets.length,
			samples: smsTargets.slice(0, 5).map(u => ({
				_id: u._id,
				send_display_name: u.send_display_name,
				send_phones: u.send_phones
			}))
		}
	};
}

module.exports = { runFullFlow, runDryRun };
