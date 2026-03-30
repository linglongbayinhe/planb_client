import { store } from '../store/index.js'

function getCurrentUid() {
	const u = store.currentUser
	return (u && (u._id || u.uid)) || ''
}

export async function syncSendPlanToCloud(patch, options = {}) {
	const uid = typeof options.uid === 'string' && options.uid.trim() ? options.uid.trim() : getCurrentUid()
	if (!uid) {
		const res = { errCode: 'UID_REQUIRED', errMsg: '请先登录后再操作' }
		if (typeof options.onUidRequired === 'function') {
			options.onUidRequired(res)
		}
		return res
	}

	try {
		if (typeof uniCloud === 'undefined' || !uniCloud || typeof uniCloud.importObject !== 'function') {
			const res = { errCode: 'CLOUD_UNAVAILABLE', errMsg: '当前环境不可用' }
			if (typeof options.onError === 'function') {
				options.onError(res)
			}
			return res
		}

		const obj = uniCloud.importObject('send_plan')
		const res = await obj.savePlan(patch, uid)
		if (res && res.errCode) {
			if (res.errCode === 'UID_REQUIRED') {
				if (typeof options.onUidRequired === 'function') {
					options.onUidRequired(res)
				}
			} else if (typeof options.onError === 'function') {
				options.onError(res)
			}
		}
		return res || { success: true }
	} catch (e) {
		const res = { errCode: 'DB_ERROR', errMsg: (e && e.message) || '云端同步失败' }
		if (typeof options.onError === 'function') {
			options.onError(res)
		}
		return res
	}
}
