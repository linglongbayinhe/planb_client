/**
 * 计划发送检查云函数
 * 由定时触发器每分钟执行，查询符合条件的用户并发邮件，发完后将 send_time 置为 null（仅执行一次）
 *
 * 入口逻辑：
 * - event.test === true 且 event.to 存在：只发一封测试邮件，不查库
 * - event.dryRun === true：只查库返回待发送用户列表，不发邮件不写库
 * - 否则：调用编排层跑完整流程
 */
'use strict';

const { createTransporter, sendTestEmail } = require('./lib/mail');
const { runFullFlow, runDryRun } = require('./lib/run');

exports.main = async (event, context) => {
	const db = uniCloud.database();
	const now = Date.now();

	// 测试模式：只给 event.to 发一封测试邮件，不查库
	if (event.test === true && event.to) {
		const transporter = createTransporter();
		if (!transporter) {
			return { errCode: 'SMTP_NOT_CONFIGURED', errMsg: '邮件服务未配置' };
		}
		try {
			await sendTestEmail(transporter, event.to);
			return { test: true, message: `测试邮件已发送至 ${event.to}` };
		} catch (e) {
			console.error('测试邮件发送失败', e);
			return { errCode: 'TEST_SEND_FAILED', errMsg: String(e.message) };
		}
	}

	// 仅查询模式：只返回待发送用户列表
	if (event.dryRun === true) {
		return await runDryRun(db, now);
	}

	// 完整流程
	return await runFullFlow(db, now);
};
