// 云对象：用户点击「登录」按钮成功后，将登录时间和 IP 同步到云数据库 users 表
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
	 * 记录用户本次登录时间与 IP 到 users 表的 last_login_date、last_login_ip 字段
	 * @param {string} [uid] 用户 ID；不传时从 uni-id token 自动解析
	 * @returns {object} { success: true } 或 { errCode, errMsg }
	 */
	async recordLoginTime(uid) {
		// 若前端未传 uid，从 token 解析
		if (!uid || typeof uid !== 'string') {
			if (this._uniId && typeof this.getUniIdToken === 'function') {
				const token = this.getUniIdToken()
				if (token) {
					try {
						const payload = await this._uniId.checkToken(token)
						if (payload && payload.uid) uid = payload.uid
					} catch (e) {}
				}
			}
		}

		if (!uid || typeof uid !== 'string') {
			return { errCode: 'UID_REQUIRED', errMsg: '缺少用户 uid，请先登录后再操作' }
		}

		// 从客户端信息获取 IP（云对象环境）
		let clientIP = ''
		try {
			const info = this.getClientInfo()
			clientIP = (info && (info.clientIP || info.CLIENTIP)) || ''
		} catch (e) {}

		const now = Date.now()
		const updateData = { last_login_date: now }
		if (clientIP) updateData.last_login_ip = clientIP

		const db = uniCloud.database()
		try {
			await db.collection('users').doc(uid).update(updateData)
			return { success: true }
		} catch (e) {
			return { errCode: 'DB_ERROR', errMsg: e.message || '写入登录时间失败' }
		}
	}
}
