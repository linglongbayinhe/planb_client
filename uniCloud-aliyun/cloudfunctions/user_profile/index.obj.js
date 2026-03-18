'use strict'

function toIsoDate(v) {
	if (!v) return null
	if (typeof v === 'number' && isFinite(v)) return new Date(v).toISOString()
	if (typeof v === 'string') {
		const t = Date.parse(v)
		return isNaN(t) ? null : new Date(t).toISOString()
	}
	if (v instanceof Date) return v.toISOString()
	// 兼容数据库 timestamp 对象
	if (typeof v === 'object' && v.toDate && typeof v.toDate === 'function') {
		const d = v.toDate()
		return d && d.toISOString ? d.toISOString() : null
	}
	return null
}

module.exports = {
	_before() {
		try {
			const uniIdCommon = require('uni-id-common')
			this._uniId = uniIdCommon.createInstance({ clientInfo: this.getClientInfo() })
		} catch (e) {
			this._uniId = null
		}
	},

	async getBootstrap(uid) {
		let userId = uid
		if (!userId || typeof userId !== 'string') {
			if (this._uniId && typeof this.getUniIdToken === 'function') {
				const token = this.getUniIdToken()
				if (token) {
					try {
						const payload = await this._uniId.checkToken(token)
						if (payload && payload.uid) userId = payload.uid
					} catch (e) {}
				}
			}
		}
		if (!userId || typeof userId !== 'string') {
			return { errCode: 'UID_REQUIRED', errMsg: '请先登录' }
		}

		try {
			const db = uniCloud.database()
			const docRes = await db.collection('uni-id-users').doc(userId).get()
			const userList = (docRes && docRes.data) || []
			if (userList.length === 0) {
				return { errCode: 'USER_NOT_FOUND', errMsg: '用户不存在' }
			}
			const user = userList[0]

			return {
				errCode: 0,
				errMsg: '',
				userInfo: {
					_id: user._id,
					email: user.email || '',
					nickname: user.nickname || '',
					avatar: user.avatar || ''
				},
				plan: {
					enabled: !!user.enable_sending,
					sendDate: toIsoDate(user.send_time),
					emails: Array.isArray(user.send_emails) ? user.send_emails : [],
					phones: Array.isArray(user.send_phones) ? user.send_phones : [],
					displayName: user.send_display_name || '',
					customGuide: user.send_message || ''
				}
			}
		} catch (e) {
			return { errCode: 'DB_ERROR', errMsg: e.message || '读取用户信息失败' }
		}
	}
}
