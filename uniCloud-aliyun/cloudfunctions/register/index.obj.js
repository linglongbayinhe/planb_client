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
			created_time: now,
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
	},

	/**
	 * 第三方登录（微信/QQ）：用 code 换取 openid，查库或建用户后返回 token
	 * 环境变量：WECHAT_MINI_APPID、WECHAT_MINI_SECRET（微信）；QQ_MINI_APPID、QQ_MINI_SECRET（QQ）
	 * @param {string} provider 'weixin' | 'qq'
	 * @param {string} code 前端 uni.login 拿到的 code
	 * @returns {object} 成功 { errCode: 0, newToken, userInfo }；失败 { errCode, errMsg }
	 */
	async oauthLogin(provider, code) {
		const p = (provider && String(provider).toLowerCase()) === 'qq' ? 'qq' : 'weixin'
		const c = (code && typeof code === 'string') ? code.trim() : ''
		if (!c) {
			return { errCode: 'PARAM_INVALID', errMsg: '缺少登录凭证 code' }
		}

		const db = uniCloud.database()
		let openid = null
		let nickname = ''

		if (p === 'weixin') {
			const appId = process.env.WECHAT_MINI_APPID || ''
			const secret = process.env.WECHAT_MINI_SECRET || ''
			if (!appId || !secret) {
				return { errCode: 'CONFIG_MISSING', errMsg: '请配置微信小程序 AppID 与 AppSecret 环境变量' }
			}
			const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(c)}&grant_type=authorization_code`
			try {
				const res = await uniCloud.httpclient.request(url, { method: 'GET', dataType: 'json' })
				const body = res.data || {}
				if (body.errcode) {
					return { errCode: 'WECHAT_ERROR', errMsg: body.errmsg || '微信 code 校验失败' }
				}
				openid = body.openid || null
			} catch (e) {
				return { errCode: 'NETWORK_ERROR', errMsg: e.message || '请求微信接口失败' }
			}
		} else {
			// QQ 小程序：需在 QQ 互联配置并设置 QQ_MINI_APPID、QQ_MINI_SECRET，调用 QQ 的 code2session 接口
			const appId = process.env.QQ_MINI_APPID || ''
			const secret = process.env.QQ_MINI_SECRET || ''
			if (!appId || !secret) {
				return { errCode: 'CONFIG_MISSING', errMsg: '请配置 QQ 小程序 AppID 与 AppSecret 环境变量' }
			}
			const url = `https://api.q.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(c)}&grant_type=authorization_code`
			try {
				const res = await uniCloud.httpclient.request(url, { method: 'GET', dataType: 'json' })
				const body = res.data || {}
				if (body.errcode) {
					return { errCode: 'QQ_ERROR', errMsg: body.errmsg || 'QQ code 校验失败' }
				}
				openid = body.openid || null
			} catch (e) {
				return { errCode: 'NETWORK_ERROR', errMsg: e.message || '请求 QQ 接口失败' }
			}
		}

		if (!openid) {
			return { errCode: 'OAUTH_FAIL', errMsg: '未获取到用户标识' }
		}

		let user = null
		const queryRes = await db.collection('users').where(p === 'weixin' ? { 'wx_openid.mp': openid } : { qq_openid: openid }).limit(1).get()
		if (queryRes.data && queryRes.data.length > 0) {
			user = queryRes.data[0]
		}

		let uid
		if (user) {
			if (user.status === 1) {
				return { errCode: 'USER_DISABLED', errMsg: '该账号已被禁用' }
			}
			uid = user._id
			nickname = user.nickname || ''
		} else {
			const now = Date.now()
			const userDoc = p === 'weixin'
				? { wx_openid: { mp: openid }, nickname: '', status: 0, created_time: now, enable_sending: false }
				: { qq_openid: openid, nickname: '', status: 0, created_time: now, enable_sending: false }
			const addRes = await db.collection('users').add(userDoc)
			uid = addRes.id
		}

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
			userInfo: { _id: uid, email: '', nickname }
		}
	},

	/** 兼容拼写错误：前端误调 couthLogin 时转发到 oauthLogin */
	async couthLogin(provider, code) {
		return this.oauthLogin(provider, code)
	}
}
