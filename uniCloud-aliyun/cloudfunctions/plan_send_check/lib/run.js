/**
 * 编排层：主流程——查库 → 发邮件 → 将 send_time 置为 null
 */
'use strict';

const { getEligibleUsers } = require('./query');
const { createTransporter, sendPlanEmail } = require('./mail');

/**
 * 执行完整发送流程
 * @param {object} db - uniCloud 数据库实例
 * @param {number} now - 当前时间戳
 * @returns {Promise<object>}
 */
async function runFullFlow(db, now) {
	const users = await getEligibleUsers(db, now);

	if (users.length === 0) {
		return { processed: 0, message: '无符合发送条件的用户' };
	}

	const transporter = createTransporter();
	if (!transporter) {
		return { errCode: 'SMTP_NOT_CONFIGURED', errMsg: '邮件服务未配置', processed: 0 };
	}
	const results = [];

	for (const user of users) {
		const { uid, emails, sendOk } = await sendPlanEmail(transporter, user);

		// 发完后将该用户 send_time 置为 null，实现仅执行一次
		try {
			await db.collection('uni-id-users').doc(uid).update({ send_time: null });
		} catch (e) {
			console.error(`更新 send_time 失败 uid=${uid}`, e);
		}

		results.push({ uid, emails, sendOk });
	}

	return { processed: results.length, results };
}

/**
 * 仅查询模式：只返回待发送用户列表，不发邮件不写库
 * @param {object} db - uniCloud 数据库实例
 * @param {number} now - 当前时间戳
 * @returns {Promise<object>}
 */
async function runDryRun(db, now) {
	const users = await getEligibleUsers(db, now);
	return {
		dryRun: true,
		count: users.length,
		users: users.map(u => ({
			_id: u._id,
			send_display_name: u.send_display_name,
			send_emails: u.send_emails
		}))
	};
}

module.exports = { runFullFlow, runDryRun };
