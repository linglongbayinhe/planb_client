/**
 * 查询层：查库 + 筛选，返回符合条件的用户数组
 */
'use strict';

/**
 * 获取符合发送条件的用户
 * @param {object} db - uniCloud 数据库实例
 * @param {number} now - 当前时间戳
 * @returns {Promise<Array>} 符合条件的用户数组
 */
async function getEligibleUsers(db, now) {
	const { data: users } = await db.collection('uni-id-users').where({
		enable_sending: true,
		send_time: db.command.and(db.command.neq(null), db.command.lte(now))
	}).get();

	const toProcess = users.filter(u => {
		const displayName = String(u.send_display_name || '').trim();
		const message = String(u.send_message || '').trim();
		const emails = Array.isArray(u.send_emails) ? u.send_emails : [];
		const validEmails = emails.filter(e => e && String(e).trim());
		return displayName !== '' && message !== '' && validEmails.length > 0;
	});

	return toProcess;
}

module.exports = { getEligibleUsers };
