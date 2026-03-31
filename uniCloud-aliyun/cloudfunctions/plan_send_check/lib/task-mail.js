'use strict';

function normalizeEmailRecipients(list) {
	if (!Array.isArray(list)) return [];
	const seen = new Set();
	const result = [];
	for (const item of list) {
		const value = String(item || '').trim().toLowerCase();
		if (value && !seen.has(value)) {
			seen.add(value);
			result.push(value);
		}
	}
	return result;
}

async function sendTaskEmail(transporter, task, fromAddr) {
	const uid = task && task.uid ? task.uid : undefined;
	const taskId = task && task._id ? task._id : undefined;
	const displayName = String((task && task.display_name) || '').trim();
	const clueInfo = String((task && task.message) || '').trim();
	const recipients = normalizeEmailRecipients(task && task.recipients);

	if (!transporter) {
		return {
			taskId,
			uid,
			recipients: recipients.length,
			sendOk: false,
			error: 'SMTP_NOT_CONFIGURED'
		};
	}

	if (recipients.length === 0) {
		return { taskId, uid, recipients: 0, sendOk: true, error: '' };
	}

	const body = `你好，
如果你收到了这条通知，${displayName} 可能暂时无法亲自与你联系。${displayName} 在 Plan B（后手）App 中预留了一份“人生备份计划”。
查找线索：请从 ${clueInfo} 开始查找。谢谢你的帮助。
—— Plan B（后手）`;

	let sendOk = true;
	let lastError = '';

	for (const toEmail of recipients) {
		try {
			await transporter.sendMail({
				from: fromAddr,
				to: toEmail,
				subject: '【Plan B】人生备份计划通知',
				text: body
			});
		} catch (e) {
			sendOk = false;
			lastError = e && e.message ? e.message : String(e);
			console.error(`发送邮件失败 task=${taskId} uid=${uid} to=${toEmail}`, e);
		}
	}

	return {
		taskId,
		uid,
		recipients: recipients.length,
		sendOk,
		error: lastError
	};
}

module.exports = {
	sendTaskEmail
};
