// 云对象：同步用户「是否开启发送计划」到云数据库 users 表
// 调用时传入 enable_sending，uid 可选（不传时尝试从 uni-id token 解析）
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
	 * 设置用户的 enable_sending 并写入云数据库 users 表
	 * @param {boolean} enable_sending 是否开启发送计划
	 * @param {string} [uid] 用户 ID（对应 users 表 _id），不传则从 uni-id token 解析
	 * @returns {object} { errCode, errMsg } 或 { success: true }
	 */
	async setEnableSending(enable_sending, uid) {
		if (typeof enable_sending !== 'boolean') {
			return {
				errCode: 'PARAM_INVALID',
				errMsg: 'enable_sending 必须为布尔值'
			}
		}

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
			return {
				errCode: 'UID_REQUIRED',
				errMsg: '缺少用户 uid，请先登录后再操作'
			}
		}

		const db = uniCloud.database()
		try {
			await db.collection('users').doc(uid).update({
				enable_sending
			})
			return { success: true }
		} catch (e) {
			return {
				errCode: 'DB_ERROR',
				errMsg: e.message || '写入云数据库失败'
			}
		}
	}
}
