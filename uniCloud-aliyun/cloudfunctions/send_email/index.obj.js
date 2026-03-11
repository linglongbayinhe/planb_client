// 云对象：发送页面添加/删除邮箱时，同步到云数据库 users 表的 send_emails 字段
'use strict'

const MAX_EMAILS = 3

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
	 * 添加或从 users 表移除一个邮箱，更新 send_emails 数组
	 * @param {string} email  邮箱地址
	 * @param {boolean} isNew  true=新增（加入列表），false=删除（从列表移除）
	 * @param {string} [uid]   用户 ID；不传时从 uni-id token 解析
	 * @returns {object} { success: true } 或 { errCode, errMsg }
	 */
	async updateSendEmail(email, isNew, uid) {
		const e = (email && typeof email === 'string') ? email.trim().toLowerCase() : ''
		if (!e) {
			return { errCode: 'PARAM_INVALID', errMsg: '邮箱不能为空' }
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
			return { errCode: 'PARAM_INVALID', errMsg: '邮箱格式无效' }
		}
		if (typeof isNew !== 'boolean') {
			return { errCode: 'PARAM_INVALID', errMsg: 'isNew 必须为布尔值' }
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
			const docRes = await db.collection('users').doc(uid).get()
			if (!docRes.data || docRes.data.length === 0) {
				return { errCode: 'USER_NOT_FOUND', errMsg: '用户不存在' }
			}
			const user = docRes.data[0]
			let list = Array.isArray(user.send_emails) ? user.send_emails.map(x => String(x).trim().toLowerCase()) : []

			if (isNew) {
				if (list.includes(e)) return { success: true }
				if (list.length >= MAX_EMAILS) {
					return { errCode: 'MAX_EMAILS', errMsg: '最多只能添加 ' + MAX_EMAILS + ' 个邮箱' }
				}
				list = [...list, e]
			} else {
				list = list.filter(x => x !== e)
			}

			await db.collection('users').doc(uid).update({ send_emails: list })
			return { success: true }
		} catch (err) {
			return { errCode: 'DB_ERROR', errMsg: err.message || '更新失败' }
		}
	}
}
