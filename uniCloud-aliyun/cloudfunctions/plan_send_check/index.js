/**
 * 计划发送检查云函数
 * 由定时触发器定时执行，单次查库后按通道分流：发邮件 / 发短信，最后批量将 send_time 置为 null
 *
 * 入口逻辑：
 * - event.test === true 且 event.to：只发一封测试邮件，不查库
 * - event.testSms === true 且 event.phone：只发一条测试短信，不查库
 * - event.dryRun === true：只查库返回双通道命中统计，不发送不写库
 * - 否则：调用编排层跑完整流程（邮件 + 短信）
 */
'use strict';

const { createTransporter, sendTestEmail } = require('./lib/mail');
const { sendTestSms } = require('./lib/sms');
const { runFullFlow, runDryRun } = require('./lib/run');

exports.main = async (event, context) => {
	const db = uniCloud.database();
	const now = Date.now();

	// 测试邮件模式
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

	// 测试短信模式
	if (event.testSms === true && event.phone) {
		try {
			await sendTestSms(event.phone);
			return { testSms: true, message: `测试短信已发送至 ${event.phone}` };
		} catch (e) {
			console.error('测试短信发送失败', e);
			return { errCode: 'TEST_SMS_FAILED', errMsg: String(e.message) };
		}
	}

	// 仅查询模式
	if (event.dryRun === true) {
		return await runDryRun(db, now);
	}

	// 完整流程（邮件 + 短信）
	return await runFullFlow(db, now);
};
