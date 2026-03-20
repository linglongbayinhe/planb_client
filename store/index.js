import { reactive } from 'vue'

const defaultPlan = {
	enabled: false,
	sendDate: null,
	intervalDays: 7,
	emails: [],
	phones: [],
	displayName: '',
	customGuide: ''
}

function normalizeTokenExpired(raw) {
	const n = Number(raw)
	if (!n || !isFinite(n)) return 0
	// 兼容秒级时间戳
	return n < 1e12 ? n * 1000 : n
}

function loadJSON(key, fallback) {
	try {
		const v = uni.getStorageSync(key)
		return v ? JSON.parse(v) : fallback
	} catch (e) {
		return fallback
	}
}

function loadStr(key, fallback) {
	try {
		const v = uni.getStorageSync(key)
		return v || fallback
	} catch (e) {
		return fallback
	}
}

const defaultCategoryOrder = ['digital', 'important', 'family']

export const store = reactive({
	clues: loadJSON('clues', []),
	sendPlan: Object.assign({}, defaultPlan, loadJSON('plan', {})),
	currentUser: loadJSON('user', null),
	theme: loadStr('theme', 'minimal'),
	language: loadStr('language', 'zh-CN'),
	categoryOrder: loadJSON('clueCategoryOrder', defaultCategoryOrder)
})

export const mutations = {
	getCurrentUid() {
		const u = store.currentUser
		return (u && (u._id || u.uid)) || ''
	},

	ensureAuthForWriteAction() {
		if (this.getCurrentUid()) return true
		if (typeof uni !== 'undefined' && typeof uni.$emit === 'function') {
			uni.$emit('require-login')
		}
		return false
	},

	addClue(clue) {
		if (!this.ensureAuthForWriteAction()) return false
		const newClue = Object.assign({}, clue, {
			id: Date.now().toString(),
			updatedAt: new Date().toISOString()
		})
		store.clues = [newClue, ...store.clues]
		uni.setStorageSync('clues', JSON.stringify(store.clues))
		return true
	},

	updateClue(id, data) {
		if (!this.ensureAuthForWriteAction()) return false
		store.clues = store.clues.map(c =>
			c.id === id ? Object.assign({}, c, data, {
				updatedAt: new Date().toISOString()
			}) : c
		)
		uni.setStorageSync('clues', JSON.stringify(store.clues))
		return true
	},

	deleteClue(id) {
		if (!this.ensureAuthForWriteAction()) return false
		store.clues = store.clues.filter(c => c.id !== id)
		uni.setStorageSync('clues', JSON.stringify(store.clues))
		return true
	},

	updateSendPlan(data) {
		if (!this.ensureAuthForWriteAction()) return false
		store.sendPlan = Object.assign({}, store.sendPlan, data)
		uni.setStorageSync('plan', JSON.stringify(store.sendPlan))
		return true
	},

	setSendPlanFromCloud(payload) {
		const p = payload || {}
		const safeInterval = Number(store.sendPlan && store.sendPlan.intervalDays) || defaultPlan.intervalDays
		store.sendPlan = Object.assign({}, defaultPlan, {
			intervalDays: safeInterval,
			enabled: !!p.enabled,
			sendDate: p.sendDate || null,
			emails: Array.isArray(p.emails) ? p.emails : [],
			phones: Array.isArray(p.phones) ? p.phones : [],
			displayName: p.displayName || '',
			customGuide: p.customGuide || ''
		})
		uni.setStorageSync('plan', JSON.stringify(store.sendPlan))
	},

	applyUserBootstrap(payload) {
		const user = payload && payload.user ? payload.user : null
		const plan = payload && payload.plan ? payload.plan : {}
		this.setUser(user)
		this.setSendPlanFromCloud(plan)
	},

	setUser(user) {
		store.currentUser = user
		uni.setStorageSync('user', JSON.stringify(user))
	},

	saveAuthToken(newToken) {
		const token = newToken && newToken.token
		const tokenExpired = normalizeTokenExpired(newToken && newToken.tokenExpired)
		if (!token) return
		uni.setStorageSync('uni_id_token', token)
		if (tokenExpired > 0) {
			uni.setStorageSync('uni_id_token_expired', tokenExpired)
		}
	},

	getStoredTokenInfo() {
		try {
			const token = uni.getStorageSync('uni_id_token') || ''
			const tokenExpiredRaw = uni.getStorageSync('uni_id_token_expired')
			const tokenExpired = normalizeTokenExpired(tokenExpiredRaw)
			return { token, tokenExpired }
		} catch (e) {
			return { token: '', tokenExpired: 0 }
		}
	},

	hasValidSession() {
		const tokenInfo = this.getStoredTokenInfo()
		if (!tokenInfo.token) return false
		if (!tokenInfo.tokenExpired) return true
		return Date.now() < tokenInfo.tokenExpired
	},

	clearAuthSession() {
		store.currentUser = null
		uni.removeStorageSync('user')
		uni.removeStorageSync('uni_id_token')
		uni.removeStorageSync('uni_id_token_expired')
	},

	logout() {
		this.clearAuthSession()
		uni.removeStorageSync('users')
	},

	setTheme(theme) {
		store.theme = theme
		uni.setStorageSync('theme', theme)
	},

	setLanguage(lang) {
		store.language = lang
		uni.setStorageSync('language', lang)
	},

	setCategoryOrder(order) {
		if (!this.ensureAuthForWriteAction()) return false
		store.categoryOrder = order
		uni.setStorageSync('clueCategoryOrder', JSON.stringify(order))
		return true
	},

	resetAll() {
		store.clues = []
		store.sendPlan = Object.assign({}, defaultPlan)
		store.currentUser = null
		store.categoryOrder = defaultCategoryOrder
		uni.removeStorageSync('clues')
		uni.removeStorageSync('plan')
		uni.removeStorageSync('user')
		uni.removeStorageSync('clueCategoryOrder')
		uni.removeStorageSync('uni_id_token')
		uni.removeStorageSync('uni_id_token_expired')
		uni.removeStorageSync('users')
	}
}
