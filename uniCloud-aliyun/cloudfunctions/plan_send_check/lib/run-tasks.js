'use strict';

const { getDueTasks, getTaskSummaries } = require('./task-query');
const { createTransporter, getSmtpConfig } = require('./mail');
const { sendTaskEmail } = require('./task-mail');
const { sendTaskSms } = require('./task-sms');
const { mapWithConcurrency } = require('./concurrency');
const {
	TASK_COLLECTION,
	TASK_CHANNEL_EMAIL,
	TASK_CHANNEL_SMS,
	TASK_STATUS_PENDING,
	TASK_STATUS_PROCESSING,
	TASK_STATUS_RETRY,
	TASK_STATUS_SUCCESS,
	TASK_STATUS_FAILED,
	EMAIL_TASK_CONCURRENCY,
	SMS_TASK_CONCURRENCY,
	RETRY_INTERVAL_MS,
	LOCK_TIMEOUT_MS
} = require('./constants');

function getUpdatedCount(result) {
	if (!result || typeof result !== 'object') return 0;
	if (typeof result.updated === 'number') return result.updated;
	if (typeof result.affectedDocs === 'number') return result.affectedDocs;
	if (result.stats && typeof result.stats.updated === 'number') return result.stats.updated;
	return 0;
}

function createLockToken(taskId, now) {
	return `${taskId}:${now}:${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyChannelStats() {
	return { total: 0, success: 0, retry: 0, failed: 0, skippedLocked: 0 };
}

function addResultToStats(stats, result) {
	stats.total += 1;
	if (result.status === TASK_STATUS_SUCCESS) stats.success += 1;
	if (result.status === TASK_STATUS_RETRY) stats.retry += 1;
	if (result.status === TASK_STATUS_FAILED) stats.failed += 1;
	if (result.status === 'skipped_locked') stats.skippedLocked += 1;
}

async function claimTask(db, task, now) {
	const _ = db.command;
	const token = createLockToken(task._id, now);
	const result = await db.collection(TASK_COLLECTION)
		.where({
			_id: task._id,
			status: _.in([TASK_STATUS_PENDING, TASK_STATUS_RETRY]),
			next_retry_at: _.lte(now),
			lock_expire_at: _.lte(now)
		})
		.update({
			status: TASK_STATUS_PROCESSING,
			lock_token: token,
			lock_expire_at: now + LOCK_TIMEOUT_MS,
			updated_at: now
		});

	return getUpdatedCount(result) > 0 ? token : '';
}

async function updateClaimedTask(db, taskId, token, updateData) {
	const result = await db.collection(TASK_COLLECTION)
		.where({
			_id: taskId,
			status: TASK_STATUS_PROCESSING,
			lock_token: token
		})
		.update(updateData);

	return getUpdatedCount(result) > 0;
}

async function maybeClearSendTime(db, uid, dueAt) {
	if (!uid || !dueAt) {
		return { cleared: false, reason: 'missing_context' };
	}

	const _ = db.command;
	const taskIds = [`${uid}:${TASK_CHANNEL_EMAIL}`, `${uid}:${TASK_CHANNEL_SMS}`];
	const { data } = await db.collection(TASK_COLLECTION)
		.where({ _id: _.in(taskIds) })
		.field({ _id: true, status: true })
		.get();

	const tasks = Array.isArray(data) ? data : [];
	const hasBlockingTask = tasks.some(task =>
		task &&
		(task.status === TASK_STATUS_PENDING ||
			task.status === TASK_STATUS_PROCESSING ||
			task.status === TASK_STATUS_RETRY)
	);
	if (hasBlockingTask) {
		return { cleared: false, reason: 'waiting_other_task' };
	}

	const hasSuccess = tasks.some(task => task && task.status === TASK_STATUS_SUCCESS);
	if (!hasSuccess) {
		return { cleared: false, reason: 'no_success' };
	}

	const result = await db.collection('uni-id-users')
		.where({ _id: uid, send_time: dueAt })
		.update({ send_time: null });

	return {
		cleared: getUpdatedCount(result) > 0,
		reason: getUpdatedCount(result) > 0 ? 'cleared' : 'stale_send_time'
	};
}

async function processClaimedTask(db, task, token, sendResult) {
	const now = Date.now();
	const attemptCount = Number(task.attempt_count || 0) + 1;

	if (sendResult.sendOk) {
		const updated = await updateClaimedTask(db, task._id, token, {
			status: TASK_STATUS_SUCCESS,
			attempt_count: attemptCount,
			next_retry_at: 0,
			lock_token: '',
			lock_expire_at: 0,
			last_error: '',
			last_sent_at: now,
			updated_at: now
		});
		if (!updated) {
			return {
				taskId: task._id,
				channel: task.channel,
				status: 'skipped_locked',
				recipients: sendResult.recipients
			};
		}

		const clearResult = await maybeClearSendTime(db, task.uid, task.due_at);
		return {
			taskId: task._id,
			channel: task.channel,
			status: TASK_STATUS_SUCCESS,
			recipients: sendResult.recipients,
			clearedSendTime: !!clearResult.cleared
		};
	}

	const maxAttempts = Number(task.max_attempts || 3);
	const exhausted = attemptCount >= maxAttempts;
	const updated = await updateClaimedTask(db, task._id, token, {
		status: exhausted ? TASK_STATUS_FAILED : TASK_STATUS_RETRY,
		attempt_count: attemptCount,
		next_retry_at: exhausted ? Number(task.next_retry_at || 0) : now + RETRY_INTERVAL_MS,
		lock_token: '',
		lock_expire_at: 0,
		last_error: sendResult.error || 'SEND_FAILED',
		updated_at: now
	});
	if (!updated) {
		return {
			taskId: task._id,
			channel: task.channel,
			status: 'skipped_locked',
			recipients: sendResult.recipients
		};
	}

	const clearResult = exhausted
		? await maybeClearSendTime(db, task.uid, task.due_at)
		: { cleared: false };

	return {
		taskId: task._id,
		channel: task.channel,
		status: exhausted ? TASK_STATUS_FAILED : TASK_STATUS_RETRY,
		recipients: sendResult.recipients,
		error: sendResult.error || 'SEND_FAILED',
		clearedSendTime: !!clearResult.cleared
	};
}

async function processTask(db, task, sendFn) {
	const claimNow = Date.now();
	const token = await claimTask(db, task, claimNow);
	if (!token) {
		return {
			taskId: task._id,
			channel: task.channel,
			status: 'skipped_locked',
			recipients: 0
		};
	}

	let sendResult;
	try {
		sendResult = await sendFn(task);
	} catch (e) {
		sendResult = {
			taskId: task._id,
			uid: task.uid,
			recipients: Array.isArray(task.recipients) ? task.recipients.length : 0,
			sendOk: false,
			error: e && e.message ? e.message : String(e)
		};
	}

	return processClaimedTask(db, task, token, sendResult);
}

function summarizeChannelResults(results) {
	const stats = createEmptyChannelStats();
	for (const result of results) {
		addResultToStats(stats, result);
	}
	return stats;
}

async function runFullFlow(db, now) {
	const dueTasks = await getDueTasks(db, now);
	if (dueTasks.length === 0) {
		return { processed: 0, message: '无到期任务' };
	}

	const emailTasks = dueTasks.filter(task => task.channel === TASK_CHANNEL_EMAIL);
	const smsTasks = dueTasks.filter(task => task.channel === TASK_CHANNEL_SMS);

	const transporter = emailTasks.length > 0 ? createTransporter() : null;
	const fromAddr = transporter ? getSmtpConfig().from : '';

	const emailResults = await mapWithConcurrency(
		emailTasks,
		EMAIL_TASK_CONCURRENCY,
		task => processTask(db, task, currentTask => sendTaskEmail(transporter, currentTask, fromAddr))
	);
	const smsResults = await mapWithConcurrency(
		smsTasks,
		SMS_TASK_CONCURRENCY,
		task => processTask(db, task, sendTaskSms)
	);

	const summary = {
		processed: dueTasks.length,
		email: summarizeChannelResults(emailResults),
		sms: summarizeChannelResults(smsResults),
		results: {
			email: emailResults,
			sms: smsResults
		}
	};
	console.log('[plan_send_check][run]', {
		processed: summary.processed,
		email: summary.email,
		sms: summary.sms
	});
	return summary;
}

function summarizeTasks(tasks) {
	const channelStats = {
		[TASK_CHANNEL_EMAIL]: 0,
		[TASK_CHANNEL_SMS]: 0
	};
	const statusStats = {};
	let earliestNextRetryAt = null;

	for (const task of tasks) {
		if (task && channelStats[task.channel] !== undefined) {
			channelStats[task.channel] += 1;
		}

		const status = task && task.status ? task.status : 'unknown';
		statusStats[status] = (statusStats[status] || 0) + 1;

		const nextRetryAt = Number(task && task.next_retry_at);
		if (nextRetryAt > 0 && (earliestNextRetryAt == null || nextRetryAt < earliestNextRetryAt)) {
			earliestNextRetryAt = nextRetryAt;
		}
	}

	return {
		channelStats,
		statusStats,
		earliestNextRetryAt
	};
}

async function runDryRun(db, now) {
	const tasks = await getTaskSummaries(db);
	const stats = summarizeTasks(tasks);
	const sortedSamples = tasks
		.slice()
		.sort((left, right) => Number(left.next_retry_at || 0) - Number(right.next_retry_at || 0))
		.slice(0, 5);

	const summary = {
		dryRun: true,
		totalTasks: tasks.length,
		channel: stats.channelStats,
		status: stats.statusStats,
		processing: stats.statusStats[TASK_STATUS_PROCESSING] || 0,
		earliest_next_retry_at: stats.earliestNextRetryAt,
		overdue: tasks.filter(task =>
			(task.status === TASK_STATUS_PENDING || task.status === TASK_STATUS_RETRY) &&
			Number(task.next_retry_at || 0) <= now
		).length,
		samples: sortedSamples,
		logMode: 'dryRun'
	};
	console.log('[plan_send_check][dryRun]', {
		totalTasks: summary.totalTasks,
		channel: summary.channel,
		status: summary.status,
		processing: summary.processing,
		earliest_next_retry_at: summary.earliest_next_retry_at,
		overdue: summary.overdue
	});
	return summary;
}

module.exports = {
	runFullFlow,
	runDryRun
};
