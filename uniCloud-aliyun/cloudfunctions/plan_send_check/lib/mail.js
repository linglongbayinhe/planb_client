/**
 * 发送层：创建 transporter 和发送计划邮件，不查库
 */
'use strict';

const nodemailer = require('nodemailer');
const path = require('path');
const createConfig = require('uni-config-center');
/** 显式指向云函数包内的 common，避免 require 解析到错误目录时读不到 uni-id/config.json */
const UNI_CONFIG_ROOT = path.join(__dirname, '../../common/uni-config-center');
const uniIdConfig = createConfig({ pluginId: 'uni-id', root: UNI_CONFIG_ROOT });

function getSmtpConfig() {
	const c = (key, def) => {
		const envVal = process.env[key];
		if (envVal != null && envVal !== '') return envVal;
		const configVal = uniIdConfig.config(key);
		return configVal != null ? configVal : def;
	};
	return {
		host: c('SMTP_HOST', ''),
		port: parseInt(c('SMTP_PORT', '465'), 10),
		user: c('SMTP_USER', ''),
		pass: c('SMTP_PASS', ''),
		from: c('SMTP_FROM', '') || c('SMTP_USER', '')
	};
}
/**
 * 创建 SMTP transporter（使用环境变量 SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS）
 * @returns {object | null} 成功返回 transporter，失败返回 null
 */
function createTransporter() {
	const { host, port, user, pass } = getSmtpConfig();
	if (!host || !user || !pass) {
		console.error('SMTP 未配置：请在阿里云 FC 环境变量或 common/uni-config-center/uni-id/config.json 中配置 SMTP_HOST, SMTP_USER, SMTP_PASS');
		return null;
	}

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass }
	});
}

/**
 * 给单个用户发送计划邮件（不查库）
 * @param {object} transporter - nodemailer transporter
 * @param {object} user - 用户对象，含 send_display_name、send_message、send_emails、_id
 * @returns {Promise<{ uid: string, emails: number, sendOk: boolean }>}
 */
async function sendPlanEmail(transporter, user) {
	const fromAddr = getSmtpConfig().from;
	const uid = user._id;
	const displayName = String(user.send_display_name || '').trim();
	const clueInfo = String(user.send_message || '').trim();
	const emails = Array.isArray(user.send_emails) ? user.send_emails.filter(e => e && String(e).trim()) : [];

	const body = `你好，

如果你收到了这条通知，${displayName} 可能暂时无法亲自与你联系。${displayName} 在 Plan B（后手）App 中预留了一份「人生备份计划」。
查找线索：请从${clueInfo}开始查找。
谢谢你的帮助。
—— Plan B（后手）`;

	let sendOk = true;
	for (const to of emails) {
		const toEmail = String(to).trim().toLowerCase();
		if (!toEmail) continue;
		try {
			await transporter.sendMail({
				from: fromAddr,
				to: toEmail,
				subject: '【Plan B】人生备份计划通知',
				text: body
			});
		} catch (e) {
			console.error(`发送邮件失败 uid=${uid} to=${toEmail}`, e);
			sendOk = false;
		}
	}

	return { uid, emails: emails.length, sendOk };
}

/**
 * 发送测试邮件（fromAddr 从 process.env.SMTP_FROM / SMTP_USER 读取）
 * @param {object} transporter - nodemailer transporter
 * @param {string} to - 收件人邮箱
 */
async function sendTestEmail(transporter, to) {
	const fromAddr = getSmtpConfig().from;
	const toEmail = String(to).trim().toLowerCase();
	const body = `这是 Plan B 计划发送检查云函数的测试邮件。
如果你收到此邮件，说明 SMTP 配置正常。
—— Plan B（后手）`;

	await transporter.sendMail({
		from: fromAddr,
		to: toEmail,
		subject: '【Plan B】测试邮件',
		text: body
	});
}

module.exports = { createTransporter, sendPlanEmail, sendTestEmail };
