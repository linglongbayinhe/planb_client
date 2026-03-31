'use strict';

const { sendPlanSms } = require('./sms');

function createSmsUser(task) {
	const templateData = task && task.template_data && typeof task.template_data === 'object'
		? task.template_data
		: {};

	return Object.assign({}, templateData, {
		_id: task && task.uid ? task.uid : undefined,
		send_phones: Array.isArray(task && task.recipients) ? task.recipients : [],
		send_display_name: String((task && task.display_name) || '').trim(),
		send_message: String((task && task.message) || '').trim()
	});
}

async function sendTaskSms(task) {
	const smsUser = createSmsUser(task);
	const result = await sendPlanSms(smsUser);
	return {
		taskId: task && task._id ? task._id : undefined,
		uid: task && task.uid ? task.uid : undefined,
		recipients: result && typeof result.phones === 'number' ? result.phones : 0,
		sendOk: !!(result && result.sendOk),
		error: result && result.sendOk ? '' : 'SMS_SEND_FAILED'
	};
}

module.exports = {
	sendTaskSms
};
