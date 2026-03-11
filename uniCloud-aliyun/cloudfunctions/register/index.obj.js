// 云对象：邮箱+密码注册，写入云数据库 users 表
// 依赖：uni-id-common（用于注册成功后生成 token）
'use strict'

const crypto = require('crypto')

// 密码加密（与登录校验一致）。生产环境请在云空间「云函数/云对象」→ 配置 → 环境变量中设置 UNI_ID_PASSWORD_SECRET
const PASSWORD_SECRET = process.env.UNI_ID_PASSWORD_SECRET || 'planb-register-secret-change-in-production'

function hashPassword(password) {
	return crypto.pbkdf2Sync(password, PASSWORD_SECRET, 10000, 64, 'sha512').toString('hex')
}

function verifyPassword(password, storedHash) {
	return storedHash && hashPassword(password) === storedHash
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

	/**
	 * 邮箱+密码注册，写入 users 表
	 * @param {string} email 邮箱
	 * @param {string} password 密码（明文，云端加密存储）
	 * @param {string} [nickname] 昵称
	 * @returns {object} 成功返回 { errCode: 0, newToken, userInfo }；邮箱已存在返回 { errCode: 'EMAIL_EXISTS', errMsg }
	 */
	async registerUser(email, password, nickname) {
		const e = (email && typeof email === 'string') ? email.trim() : ''
		const p = (password && typeof password === 'string') ? password : ''

		if (!e) {
			return { errCode: 'PARAM_INVALID', errMsg: '请输入邮箱' }
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
			return { errCode: 'PARAM_INVALID', errMsg: '邮箱格式无效' }
		}
		if (p.length < 6) {
			return { errCode: 'PARAM_INVALID', errMsg: '密码至少需要6位' }
		}

		const db = uniCloud.database()

		// 1. 邮箱唯一性：只查 users 表
		const existRes = await db.collection('users').where({ email: e }).limit(1).count()
		if (existRes.total > 0) {
			return { errCode: 'EMAIL_EXISTS', errMsg: '该邮箱已注册' }
		}

		// 2. 写入 users 表（与 uni-id-users 结构兼容）
		const now = Date.now()
		const userDoc = {
			email: e,
			password: hashPassword(p),
			password_secret_version: 1,
			nickname: (nickname && typeof nickname === 'string') ? nickname.trim() : '',
			status: 0,
			email_confirmed: 0,
			register_date: now,
			enable_sending: false
		}

		let uid
		try {
			const addRes = await db.collection('users').add(userDoc)
			uid = addRes.id
		} catch (err) {
			// 并发下可能唯一索引冲突，再判断一次
			const again = await db.collection('users').where({ email: e }).limit(1).count()
			if (again.total > 0) {
				return { errCode: 'EMAIL_EXISTS', errMsg: '该邮箱已注册' }
			}
			return { errCode: 'DB_ERROR', errMsg: err.message || '注册失败' }
		}

		// 3. 生成 token（与 uni-id 兼容，便于后续 set_enable_sending 等使用）
		let newToken = null
		if (this._uniId && uid) {
			try {
				const tokenRes = await this._uniId.createToken({ uid })
				if (tokenRes.token && tokenRes.tokenExpired) {
					newToken = { token: tokenRes.token, tokenExpired: tokenRes.tokenExpired }
				}
			} catch (tokenErr) {}
		}

		return {
			errCode: 0,
			errMsg: '',
			newToken,
			userInfo: { _id: uid, email: e, nickname: userDoc.nickname }
		}
	},

	/**
	 * 邮箱+密码登录，校验后返回 token
	 * @param {string} email 邮箱
	 * @param {string} password 密码
	 * @returns {object} 成功返回 { errCode: 0, newToken, userInfo }；失败返回 { errCode, errMsg }
	 */
	async login(email, password) {
		const e = (email && typeof email === 'string') ? email.trim() : ''
		const p = (password && typeof password === 'string') ? password : ''

		if (!e || !p) {
			return { errCode: 'PARAM_INVALID', errMsg: '请输入邮箱和密码' }
		}

		const db = uniCloud.database()
		const res = await db.collection('users').where({ email: e }).limit(1).get()

		if (!res.data || res.data.length === 0) {
			return { errCode: 'USER_NOT_FOUND', errMsg: '该邮箱尚未注册' }
		}

		const user = res.data[0]
		if (user.status === 1) {
			return { errCode: 'USER_DISABLED', errMsg: '该账号已被禁用' }
		}

		if (!verifyPassword(p, user.password)) {
			return { errCode: 'PASSWORD_ERROR', errMsg: '密码不正确' }
		}

		const uid = user._id
		let newToken = null
		if (this._uniId) {
			try {
				const tokenRes = await this._uniId.createToken({ uid })
				if (tokenRes.token && tokenRes.tokenExpired) {
					newToken = { token: tokenRes.token, tokenExpired: tokenRes.tokenExpired }
				}
			} catch (tokenErr) {}
		}

		return {
			errCode: 0,
			errMsg: '',
			newToken,
			userInfo: { _id: uid, email: user.email, nickname: user.nickname || '' }
		}
	}
}
