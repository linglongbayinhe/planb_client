'use strict'

const uniConfigCenter = require('uni-config-center')

const SUPPORTED_PROVIDERS = ['weixin', 'toutiao', 'xiaohongshu']

function now() {
	return Date.now()
}

function normalizeProvider(provider) {
	const p = String(provider || '').trim().toLowerCase()
	return SUPPORTED_PROVIDERS.includes(p) ? p : ''
}

function getUniIdConfig() {
	try {
		const cfg = uniConfigCenter({ pluginId: 'uni-id' }).config() || {}
		return cfg
	} catch (e) {
		return {}
	}
}

function getProviderConfig(provider) {
	const cfg = getUniIdConfig()
	if (provider === 'weixin') {
		const weixinStandard = (((cfg['mp-weixin'] || {}).oauth || {}).weixin) || {}
		const weixinLegacy = ((cfg.app || {}).weixin) || {}
		const selectedAppid = process.env.WECHAT_MP_APPID || weixinStandard.appid || weixinLegacy.appid || ''
		const selectedAppsecret = process.env.WECHAT_MP_APPSECRET || weixinStandard.appsecret || weixinLegacy.appsecret || ''
		const result = {
			appid: selectedAppid,
			appsecret: selectedAppsecret
		}
		result.__debugSources = {
			hasEnvAppid: !!process.env.WECHAT_MP_APPID,
			hasEnvSecret: !!process.env.WECHAT_MP_APPSECRET,
			hasStandardAppid: !!weixinStandard.appid,
			hasStandardSecret: !!weixinStandard.appsecret,
			hasLegacyAppid: !!weixinLegacy.appid,
			hasLegacySecret: !!weixinLegacy.appsecret,
			selectedAppidLen: selectedAppid.length,
			selectedSecretLen: selectedAppsecret.length
		}
		return result
	}
	if (provider === 'toutiao') {
		const tt = (((cfg['mp-toutiao'] || {}).oauth || {}).toutiao) || {}
		return {
			appid: tt.appid || '',
			appsecret: tt.appsecret || ''
		}
	}
	if (provider === 'xiaohongshu') {
		const xhsOauth = ((cfg['mp-xhs'] || {}).oauth) || {}
		const xhs = xhsOauth.xiaohongshu || xhsOauth.xhs || {}
		return {
			appid: xhs.appid || '',
			appsecret: xhs.appsecret || ''
		}
	}
	return { appid: '', appsecret: '' }
}

function buildUserMatchQuery(provider, openid) {
	if (provider === 'weixin') return { 'wx_openid.mp': openid }
	if (provider === 'toutiao') return { 'tt_openid.mp': openid }
	if (provider === 'xiaohongshu') return { 'xhs_openid.mp': openid }
	return { _id: '__INVALID__' }
}

function buildProviderOpenidPatch(provider, openid) {
	if (provider === 'weixin') return { wx_openid: { mp: openid } }
	if (provider === 'toutiao') return { tt_openid: { mp: openid } }
	if (provider === 'xiaohongshu') return { xhs_openid: { mp: openid } }
	return {}
}

function buildProviderIdentity(provider, payload) {
	return {
		provider,
		openid: payload.openid,
		unionid: payload.unionid || '',
		sessionKey: payload.sessionKey || '',
		raw: payload.raw || {}
	}
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

	async loginByProvider(provider, code, profile) {
		const normalizedProvider = normalizeProvider(provider)
		const authCode = (code && typeof code === 'string') ? code.trim() : ''
		const nickName = profile && typeof profile.nickName === 'string' ? profile.nickName.trim() : ''
		const avatarUrl = profile && typeof profile.avatarUrl === 'string' ? profile.avatarUrl.trim() : ''

		if (!normalizedProvider) {
			return { code: 1, message: 'UNSUPPORTED_PROVIDER' }
		}
		if (!authCode) {
			return { code: 1, message: 'PARAM_CODE_REQUIRED' }
		}

		try {
			const providerIdentity = await await module.exports.exchangeCode(normalizedProvider, authCode)
			const upsertRes = await module.exports.upsertUserByIdentity({
				provider: normalizedProvider,
				providerIdentity,
				profile: { nickName, avatarUrl }
			})
			const tokenInfo = await module.exports.buildToken.call(this, upsertRes.uid)
			if (!tokenInfo || !tokenInfo.token) {
				return { code: 3, message: 'TOKEN_CREATE_FAILED' }
			}
			return {
				code: 0,
				message: 'success',
				token: tokenInfo.token,
				tokenExpired: tokenInfo.tokenExpired,
				userInfo: {
					_id: upsertRes.uid,
					email: '',
					nickname: upsertRes.nickname || '',
					avatar: upsertRes.avatar || ''
				},
				provider: providerIdentity
			}
		} catch (e) {
			return {
				code: e && e.code ? e.code : 3,
				message: (e && e.message) || 'AUTH_PROVIDER_ERROR',
				debug: (e && e.debug) || null
			}
		}
	},

	async exchangeCode(provider, code) {
		if (provider !== 'weixin') {
			const err = new Error('NOT_ENABLED')
			err.code = 1
			throw err
		}
		const cfg = getProviderConfig(provider)
		if (!cfg.appid || !cfg.appsecret) {
		const debugInfo = cfg.__debugSources || {}
		const payload = Object.assign({}, debugInfo, { provider, dir: __dirname, configKeys: Object.keys(getUniIdConfig() || {}) })
		const err = new Error(`CONFIG_MISSING|dbg=${JSON.stringify(payload)}`)
			err.code = 1
		err.debug = payload
			throw err
		}
		const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(cfg.appid)}&secret=${encodeURIComponent(cfg.appsecret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
		const res = await uniCloud.httpclient.request(url, { method: 'GET', dataType: 'json' })
		const body = res && res.data ? res.data : {}
		if (body.errcode) {
			const err = new Error(body.errmsg || 'EXCHANGE_CODE_FAILED')
			err.code = 2
			throw err
		}
		if (!body.openid) {
			const err = new Error('OPENID_EMPTY')
			err.code = 2
			throw err
		}
		return buildProviderIdentity(provider, {
			openid: body.openid,
			unionid: body.unionid || '',
			sessionKey: body.session_key || '',
			raw: body
		})
	},

	async upsertUserByIdentity(input) {
		const provider = input.provider
		const identity = input.providerIdentity || {}
		const profile = input.profile || {}
		const openid = identity.openid
		if (!provider || !openid) {
			const err = new Error('IDENTITY_INVALID')
			err.code = 1
			throw err
		}

		const db = uniCloud.database()
		const users = db.collection('uni-id-users')
		const matchQuery = buildUserMatchQuery(provider, openid)
		const searchRes = await users.where(matchQuery).limit(1).get()
		const list = (searchRes && searchRes.data) || []

		const identityRecord = {
			provider,
			openid,
			unionid: identity.unionid || '',
			userInfo: {
				nickName: profile.nickName || '',
				avatarUrl: profile.avatarUrl || ''
			},
			updated_at: now()
		}

		if (list.length > 0) {
			const user = list[0]
			const ids = Array.isArray(user.identities) ? user.identities : []
			const idx = ids.findIndex(item => item && item.provider === provider)
			if (idx >= 0) {
				ids[idx] = Object.assign({}, ids[idx], identityRecord)
			} else {
				ids.push(identityRecord)
			}
			const updateData = {
				last_login_time: now(),
				identities: ids
			}
			if (profile.nickName) updateData.nickname = profile.nickName
			if (profile.avatarUrl) updateData.avatar = profile.avatarUrl
			if (provider === 'weixin' && identity.sessionKey) {
				updateData['third_party.mp_weixin.session_key'] = identity.sessionKey
			}
			await users.doc(user._id).update(updateData)
			return {
				uid: user._id,
				isNewUser: false,
				nickname: profile.nickName || user.nickname || '',
				avatar: profile.avatarUrl || user.avatar || ''
			}
		}

		const userDoc = Object.assign({
			nickname: profile.nickName || '',
			avatar: profile.avatarUrl || '',
			status: 0,
			created_time: now(),
			last_login_time: now(),
			enable_sending: false,
			identities: [identityRecord]
		}, buildProviderOpenidPatch(provider, openid))
		if (provider === 'weixin' && identity.unionid) {
			userDoc.wx_unionid = identity.unionid
		}
		if (provider === 'weixin' && identity.sessionKey) {
			userDoc.third_party = { mp_weixin: { session_key: identity.sessionKey } }
		}

		const addRes = await users.add(userDoc)
		return {
			uid: addRes.id,
			isNewUser: true,
			nickname: userDoc.nickname,
			avatar: userDoc.avatar
		}
	},

	async buildToken(uid) {
		if (!this._uniId || !uid) return { token: '', tokenExpired: 0 }
		try {
			const tokenRes = await this._uniId.createToken({ uid })
			return {
				token: tokenRes && tokenRes.token ? tokenRes.token : '',
				tokenExpired: tokenRes && tokenRes.tokenExpired ? tokenRes.tokenExpired : 0
			}
		} catch (e) {
			return { token: '', tokenExpired: 0 }
		}
	}
}
