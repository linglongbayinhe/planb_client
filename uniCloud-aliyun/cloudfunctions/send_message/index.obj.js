// 云对象：用户点击「应用」时，将展示姓名、通知正文同步到云数据库 uni-id-users 表
'use strict'

module.exports = {
	_before() {
		try {
			const uniIdCommon = require('uni-id-common')
			this._uniId = uniIdCommon.createInstance({ clientInfo: this.getClientInfo() })
		} catch (e) {
			this._uniId = null
		}
	},

	/**
	 * 更新当前用户的展示姓名、通知正文（send_display_name、send_message）
	 * @param {string} displayName 展示姓名
	 * @param {string} message      通知正文（发送说明/消息，最长 500 字）
	 * @param {string} [uid]        用户 ID；不传时从 uni-id token 解析
	 * @returns {object} { success: true } 或 { errCode, errMsg }
	 */
	async updateSendMessage(displayName, message, uid) {
		const d = (displayName != null && typeof displayName === 'string') ? displayName.trim() : ''
		const m = (message != null && typeof message === 'string') ? message.trim() : ''
		if (m.length > 500) {
			return { errCode: 'PARAM_INVALID', errMsg: '通知正文不能超过 500 字' }
		}

		if (!uid || typeof uid !== 'string') {
			if (this._uniId && typeof this.getUniIdToken === 'function') {
				const token = this.getUniIdToken()
				if (token) {
					try {
						const payload = await this._uniId.checkToken(token)
						if (payload && payload.uid) uid = payload.uid
					} catch (err) {}
				}
			}
		}
		if (!uid || typeof uid !== 'string') {
			return { errCode: 'UID_REQUIRED', errMsg: '请先登录后再操作' }
		}

		const db = uniCloud.database()
		try {
			const docRes = await db.collection('uni-id-users').doc(uid).get()
			if (!docRes || !docRes.data || !docRes.data[0]) {
				return { errCode: 'USER_NOT_FOUND', errMsg: '用户不存在' }
			}
			await db.collection('uni-id-users').doc(uid).update({
				send_display_name: d,
				send_message: m
			})
			return { success: true }
		} catch (e) {
			return { errCode: 'DB_ERROR', errMsg: e.message || '写入失败' }
		}
	}
}
