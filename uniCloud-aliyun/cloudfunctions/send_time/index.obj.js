// 云对象：用户点击「刷新倒计时」时，将新的预计发送时间同步到云数据库 users 表
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
	 * 更新用户的预计发送时间（send_time）
	 * @param {number} sendDate 预计发送时间戳（毫秒），由前端计算后传入
	 * @param {string} [uid]    用户 ID；不传时从 uni-id token 自动解析
	 * @returns {object} { success: true } 或 { errCode, errMsg }
	 */
	async updateSendTime(sendDate, uid) {
		// 参数校验
		if (typeof sendDate !== 'number' || sendDate <= 0 || !isFinite(sendDate)) {
			return { errCode: 'PARAM_INVALID', errMsg: 'sendDate 必须为有效的毫秒时间戳' }
		}
		// 拒绝过去的时间（超出 60 秒容错，防止客户端时钟轻微偏差）
		if (sendDate < Date.now() - 60 * 1000) {
			return { errCode: 'PARAM_INVALID', errMsg: 'sendDate 不能早于当前时间' }
		}

		// 若前端未传 uid，尝试从 token 解析
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

		const db = uniCloud.database()
		try {
			await db.collection('users').doc(uid).update({
				send_time: sendDate
			})
			return { success: true }
		} catch (e) {
			return { errCode: 'DB_ERROR', errMsg: e.message || '写入云数据库失败' }
		}
	}
}
