/**
 * 查询层：单次查库 + 内存分流邮件/短信目标
 */
'use strict';

/**
 * 单次查库获取所有候选用户，按通道分流为 emailTargets 和 smsTargets。
 * 同一用户可同时命中两个通道。
 * @param {object} db - uniCloud 数据库实例
 * @param {number} now - 当前时间戳
 * @returns {Promise<{ emailTargets: Array, smsTargets: Array, allCandidateIds: string[] }>}
 */
async function getEligibleTargets(db, now) {
	const { data: users } = await db.collection('uni-id-users')
		.where({
			enable_sending: true,
			send_time: db.command.and(db.command.neq(null), db.command.lte(now))
		})
		.field({
			_id: true,
			send_display_name: true,
			send_message: true,
			send_emails: true,
			send_phones: true
		})
		.get();

	const emailTargets = [];
	const smsTargets = [];
	const allCandidateIds = [];

	for (const u of users) {
		const displayName = String(u.send_display_name || '').trim();
		const message = String(u.send_message || '').trim();
		if (!displayName || !message) continue;

		let matched = false;

		const emails = Array.isArray(u.send_emails) ? u.send_emails : [];
		if (emails.filter(e => e && String(e).trim()).length > 0) {
			emailTargets.push(u);
			matched = true;
		}

		const phones = Array.isArray(u.send_phones) ? u.send_phones : [];
		if (phones.filter(p => p && String(p).trim()).length > 0) {
			smsTargets.push(u);
			matched = true;
		}

		if (matched) {
			allCandidateIds.push(u._id);
		}
	}

	return { emailTargets, smsTargets, allCandidateIds };
}

module.exports = { getEligibleTargets };
