/**
 * 短信发送层：读取配置、清洗手机号、分批调用 uniCloud.sendSms
 */
'use strict';

const fs = require('fs');
const path = require('path');
const createConfig = require('uni-config-center');
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
const LOCAL_SMS_PATH = path.join(__dirname, '..', 'sms.config.json');
let _localSmsCache;

const MAX_PHONES_PER_BATCH = 50;

function loadLocalSmsFile() {
	if (_localSmsCache !== undefined) return _localSmsCache;
	_localSmsCache = {};
	try {
		if (fs.existsSync(LOCAL_SMS_PATH)) {
			_localSmsCache = JSON.parse(fs.readFileSync(LOCAL_SMS_PATH, 'utf8')) || {};
		}
	} catch (_) {
		_localSmsCache = {};
	}
	return _localSmsCache;
}

function getSmsConfig() {
	const c = (key, def) => {
		const envVal = process.env[key];
		if (envVal != null && envVal !== '') return envVal;
		const configVal = uniIdConfig.config(key);
		if (configVal != null && configVal !== '') return configVal;
		if (uniIdConfigModuleRoot) {
			const moduleVal = uniIdConfigModuleRoot.config(key);
			if (moduleVal != null && moduleVal !== '') return moduleVal;
		}
		const local = loadLocalSmsFile();
		const localVal = local[key];
		if (localVal != null && String(localVal).trim() !== '') return localVal;
		return def;
	};

	const rawMap = c('SMS_DATA_MAP', '{}');
	const cfg = {
		appid: c('SMS_APPID', ''),
		templateId: c('SMS_TEMPLATE_ID', ''),
		dataMap: typeof rawMap === 'string' ? JSON.parse(rawMap) : rawMap
	};
	return cfg;
}

/**
 * 根据 dataMap 配置，从用户文档取值构建短信模板变量
 * dataMap 示例：{ "name": "send_display_name", "code": "send_message" }
 */
function buildTemplateData(user, dataMap) {
	const data = {};
	for (const [templateVar, userField] of Object.entries(dataMap)) {
		data[templateVar] = String(user[userField] || '').trim();
	}
	return data;
}

/**
 * 清洗、去重用户的 send_phones 数组
 */
function cleanPhones(user) {
	const phones = Array.isArray(user.send_phones) ? user.send_phones : [];
	const seen = new Set();
	const cleaned = [];
	for (const p of phones) {
		const phone = String(p || '').trim();
		if (phone && !seen.has(phone)) {
			seen.add(phone);
			cleaned.push(phone);
		}
	}
	return cleaned;
}

/**
 * 给单个用户发送短信（手机号超过 50 个时自动分批）
 * @param {object} user - 用户文档，含 _id、send_phones、send_display_name、send_message
 * @returns {Promise<{ uid: string, phones: number, sendOk: boolean }>}
 */
async function sendPlanSms(user) {
	const hasSendSmsApi = !!(typeof uniCloud !== 'undefined' && uniCloud && typeof uniCloud.sendSms === 'function');
	if (!hasSendSmsApi) {
		console.error('SMS 能力不可用：uniCloud.sendSms 不存在，请检查 uni-cloud-sms / uni-open-bridge-common 扩展是否恢复');
		return { uid: user && user._id, phones: 0, sendOk: false };
	}
	const { appid, templateId, dataMap } = getSmsConfig();
	if (!appid || !templateId) {
		console.error('SMS 未配置：请配置 SMS_APPID 和 SMS_TEMPLATE_ID');
		return { uid: user._id, phones: 0, sendOk: false };
	}

	const uid = user._id;
	const phones = cleanPhones(user);
	if (phones.length === 0) {
		return { uid, phones: 0, sendOk: true };
	}

	const data = buildTemplateData(user, dataMap);
	let sendOk = true;

	for (let i = 0; i < phones.length; i += MAX_PHONES_PER_BATCH) {
		const batch = phones.slice(i, i + MAX_PHONES_PER_BATCH);
		try {
			const params = { appid, templateId, data };
			if (batch.length === 1) {
				params.phone = batch[0];
			} else {
				params.phoneList = batch;
			}
			await uniCloud.sendSms(params);
		} catch (e) {
			console.error(`发送短信失败 uid=${uid} phones=${batch.join(',')}`, e);
			sendOk = false;
		}
	}

	return { uid, phones: phones.length, sendOk };
}

/**
 * 发送测试短信（不查库，用占位值填充模板变量）
 * @param {string} phone - 目标手机号
 */
async function sendTestSms(phone) {
	const hasSendSmsApi = !!(typeof uniCloud !== 'undefined' && uniCloud && typeof uniCloud.sendSms === 'function');
	if (!hasSendSmsApi) {
		throw new Error('SMS 能力不可用：uniCloud.sendSms 不存在，请检查 uni-cloud-sms / uni-open-bridge-common 扩展是否恢复');
	}
	const { appid, templateId, dataMap } = getSmsConfig();
	if (!appid || !templateId) {
		throw new Error('SMS 未配置：请配置 SMS_APPID 和 SMS_TEMPLATE_ID');
	}

	const data = {};
	for (const templateVar of Object.keys(dataMap)) {
		data[templateVar] = 'test';
	}

	await uniCloud.sendSms({
		appid,
		phone: String(phone).trim(),
		templateId,
		data
	});
}

module.exports = { getSmsConfig, sendPlanSms, sendTestSms };
