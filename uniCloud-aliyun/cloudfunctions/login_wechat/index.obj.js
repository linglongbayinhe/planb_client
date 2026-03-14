// 云对象：微信小程序登录（code 换取 openid，查库/建用户后返回 token）
// 替代原云函数 func_wechat_login
'use strict'

const crypto = require('crypto')
const createConfig = require('uni-config-center')
const uniIdConfig = createConfig({ pluginId: 'uni-id' })

module.exports = {
	_before() {},

	/**
	 * 微信小程序登录：用 code 换取 openid，查/建用户后返回 token
	 * @param {string} code 前端 uni.login 拿到的 code
	 * @param {string} [nickName] 微信昵称（来自 getUserProfile）
	 * @param {string} [avatarUrl] 微信头像 URL
	 * @returns {object} 成功 { code: 0, message: 'success', token, userInfo }；失败 { code: 1|2|3, message }
	 */
	async login(code, nickName, avatarUrl) {
		const c = (code && typeof code === 'string') ? code.trim() : ''
		if (!c) {
			return { code: 1, message: '缺少 code' }
		}

		const appId = process.env.WECHAT_MINI_APPID || uniIdConfig.config('app.weixin.appid')
		const secret = process.env.WECHAT_MINI_SECRET || uniIdConfig.config('app.weixin.appsecret')

		const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(c)}&grant_type=authorization_code`

		try {
			const res = await uniCloud.httpclient.request(url, { method: 'GET', dataType: 'json' })
			const resData = res.data || {}

			if (resData.errcode) {
				console.error('微信接口错误', resData)
				return { code: 2, message: '微信登录失败', error: resData }
			}

			const { openid, session_key, unionid } = resData

			const db = uniCloud.database()
			const users = db.collection('users')

			const wxQuery = users.where({ 'wx_openid.mp': openid })
			const userRes = await wxQuery.limit(1).get()
			const userList = (userRes && userRes.data) || []

			const nickname = (nickName && typeof nickName === 'string') ? nickName.trim() : ''
			const avatar = (avatarUrl && typeof avatarUrl === 'string') ? avatarUrl.trim() : ''

			let userInfo
			if (userList.length > 0) {
				userInfo = userList[0]
				const updateData = {
					last_login_time: Date.now(),
					'third_party.mp_weixin.session_key': session_key
				}
				if (nickname) updateData.nickname = nickname
				if (avatar) updateData.avatar = avatar
				await users.doc(userInfo._id).update(updateData)
				userInfo.nickname = nickname || userInfo.nickname || ''
				userInfo.avatar = avatar || userInfo.avatar || ''
			} else {
				userInfo = {
					wx_openid: { mp: openid },
					nickname,
					avatar,
					status: 0,
					created_time: Date.now(),
					last_login_time: Date.now(),
					enable_sending: false
				}
				if (unionid) userInfo.wx_unionid = unionid
				const addRes = await users.add(userInfo)
				userInfo._id = addRes.id
			}

			const token = crypto.createHash('md5').update(openid + Date.now()).digest('hex')

			return {
				code: 0,
				message: 'success',
				token,
				userInfo: {
					_id: userInfo._id,
					nickname: userInfo.nickname || '',
					avatar: userInfo.avatar || ''
				}
			}
		} catch (error) {
			console.error('云对象执行异常', error)
			return { code: 3, message: '服务器内部错误' }
		}
	}
}
