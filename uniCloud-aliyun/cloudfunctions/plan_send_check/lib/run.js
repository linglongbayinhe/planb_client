/**
 * 编排层：单次查库 → 邮件/短信双通道发送 → 批量回写 send_time
 */
'use strict';

const { getEligibleTargets } = require('./query');
const { createTransporter, sendPlanEmail } = require('./mail');
const { sendPlanSms } = require('./sms');

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

	const emailResults = [];
	if (emailTargets.length > 0) {
		const transporter = createTransporter();
		if (transporter) {
			for (const user of emailTargets) {
				emailResults.push(await sendPlanEmail(transporter, user));
			}
		} else {
			console.warn('SMTP 未配置，跳过邮件发送');
		}
	}

	const smsResults = [];
	for (const user of smsTargets) {
		smsResults.push(await sendPlanSms(user));
	}

	try {
		const _ = db.command;
		await db.collection('uni-id-users')
			.where({ _id: _.in(allCandidateIds) })
			.update({ send_time: null });
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
