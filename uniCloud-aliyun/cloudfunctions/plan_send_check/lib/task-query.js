'use strict';

const {
	TASK_COLLECTION,
	TASK_STATUS_PENDING,
	TASK_STATUS_RETRY,
	TASK_FETCH_LIMIT
} = require('./constants');

async function getDueTasks(db, now, limit = TASK_FETCH_LIMIT) {
	const _ = db.command;
	const { data } = await db.collection(TASK_COLLECTION)
		.where({
			status: _.in([TASK_STATUS_PENDING, TASK_STATUS_RETRY]),
			next_retry_at: _.lte(now),
			lock_expire_at: _.lte(now)
		})
		.orderBy('next_retry_at', 'asc')
		.limit(limit)
		.get();

	return Array.isArray(data) ? data : [];
}

async function getTaskSummaries(db) {
	const { data } = await db.collection(TASK_COLLECTION)
		.field({
			_id: true,
			uid: true,
			channel: true,
			status: true,
			due_at: true,
			next_retry_at: true,
			lock_expire_at: true,
			updated_at: true
		})
		.get();

	return Array.isArray(data) ? data : [];
}

module.exports = {
	getDueTasks,
	getTaskSummaries
};
