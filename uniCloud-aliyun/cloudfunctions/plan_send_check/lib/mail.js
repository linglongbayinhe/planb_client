/**
 * 发送层：创建 transporter 和发送计划邮件，不查库
 */
'use strict';

const path = require('path');
const fs = require('fs');
const createConfig = require('uni-config-center');
const { mapWithConcurrency } = require('./concurrency');

/** 单用户多收件人并行上限；环境变量 EMAIL_TO_CONCURRENCY（默认 3） */
const EMAIL_TO_CONCURRENCY = Math.max(
	1,
	Number.parseInt(process.env.EMAIL_TO_CONCURRENCY || '3', 10) || 3
);
/** 显式指向云函数包内的 common，避免 require 解析到错误目录时读不到 uni-id/config.json */
const UNI_CONFIG_ROOT = path.join(__dirname, '../../common/uni-config-center');
const uniIdConfig = createConfig({ pluginId: 'uni-id', root: UNI_CONFIG_ROOT });
const MODULE_CONFIG_ROOT = (() => {
	try {
		return path.dirname(require.resolve('uni-config-center/package.json'));
	} catch (_) {
		return '';
	}
})();
const uniIdConfigModuleRoot = MODULE_CONFIG_ROOT ? createConfig({ pluginId: 'uni-id', root: MODULE_CONFIG_ROOT }) : null;
/** 与云函数同目录的本地 SMTP 配置（随 plan_send_check 上传），不依赖 FC 环境变量与 common 挂载 */
const LOCAL_SMTP_PATH = path.join(__dirname, '..', 'smtp.config.json');
let _localSmtpCache;
let _nodemailerCache;
function loadLocalSmtpFile() {
	if (_localSmtpCache !== undefined) return _localSmtpCache;
	_localSmtpCache = {};
	try {
		if (fs.existsSync(LOCAL_SMTP_PATH)) {
			_localSmtpCache = JSON.parse(fs.readFileSync(LOCAL_SMTP_PATH, 'utf8')) || {};
		}
	} catch (_) {
		_localSmtpCache = {};
	}
	return _localSmtpCache;
}
function getNodemailer() {
	if (_nodemailerCache) return _nodemailerCache;
	try {
		_nodemailerCache = require('nodemailer');
		return _nodemailerCache;
	} catch (e) {
		return null;
	}
}

function getSmtpConfig() {
	const c = (key, def) => {
		const envVal = process.env[key];
		if (envVal != null && envVal !== '') return envVal;
		const forcedVal = uniIdConfig.config(key);
		if (forcedVal != null && forcedVal !== '') return forcedVal;
		if (uniIdConfigModuleRoot) {
			const moduleVal = uniIdConfigModuleRoot.config(key);
			if (moduleVal != null && moduleVal !== '') return moduleVal;
		}
		const local = loadLocalSmtpFile();
		const lv = local[key];
		if (lv != null && String(lv).trim() !== '') return String(lv).trim();
		return def;
	};
	const cfg = {
		host: c('SMTP_HOST', ''),
		port: parseInt(c('SMTP_PORT', '465'), 10),
		user: c('SMTP_USER', ''),
		pass: c('SMTP_PASS', ''),
		from: c('SMTP_FROM', '') || c('SMTP_USER', '')
	};
	return cfg;
}
/**
 * 创建 SMTP transporter（使用环境变量 SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS）
 * @returns {object | null} 成功返回 transporter，失败返回 null
 */
function createTransporter() {
	const nodemailer = getNodemailer();
	if (!nodemailer) {
		console.error('邮件依赖 nodemailer 加载失败，请重新上传 plan_send_check 并确保依赖完整安装');
		return null;
	}
	const { host, port, user, pass } = getSmtpConfig();
	if (!host || !user || !pass) {
		console.error('SMTP 未配置：请在阿里云 FC 环境变量、common/uni-config-center/uni-id/config.json，或与 plan_send_check 同级的 smtp.config.json 中配置 SMTP_HOST, SMTP_USER, SMTP_PASS');
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

	const toList = emails
		.map((to) => String(to || '').trim().toLowerCase())
		.filter(Boolean);

	if (toList.length === 0) {
		return { uid, emails: 0, sendOk: true };
	}

	const sendOutcomes = await mapWithConcurrency(toList, EMAIL_TO_CONCURRENCY, async (toEmail) => {
		try {
			await transporter.sendMail({
				from: fromAddr,
				to: toEmail,
				subject: '【Plan B】人生备份计划通知',
				text: body
			});
			return true;
		} catch (e) {
			console.error(`发送邮件失败 uid=${uid} to=${toEmail}`, e);
			return false;
		}
	});

	const sendOk = sendOutcomes.every(Boolean);
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

module.exports = { createTransporter, getSmtpConfig, sendPlanEmail, sendTestEmail };
