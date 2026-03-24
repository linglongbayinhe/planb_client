/**
 * 对列表按固定并发数执行异步任务，保持结果顺序与输入一致
 * @param {Array} items
 * @param {number} concurrency
 * @param {(item: *, index: number) => Promise<*>} fn
 * @returns {Promise<Array>}
 */
async function mapWithConcurrency(items, concurrency, fn) {
	const results = new Array(items.length);
	let next = 0;
	async function worker() {
		while (true) {
			const i = next++;
			if (i >= items.length) break;
			results[i] = await fn(items[i], i);
		}
	}
	const n = Math.min(concurrency, Math.max(items.length, 1));
	await Promise.all(Array.from({ length: n }, () => worker()));
	return results;
}

module.exports = { mapWithConcurrency };
