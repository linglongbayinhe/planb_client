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
	addClue(clue) {
		const newClue = Object.assign({}, clue, {
			id: Date.now().toString(),
			updatedAt: new Date().toISOString()
		})
		store.clues = [newClue, ...store.clues]
		uni.setStorageSync('clues', JSON.stringify(store.clues))
	},

	updateClue(id, data) {
		store.clues = store.clues.map(c =>
			c.id === id ? Object.assign({}, c, data, {
				updatedAt: new Date().toISOString()
			}) : c
		)
		uni.setStorageSync('clues', JSON.stringify(store.clues))
	},

	deleteClue(id) {
		store.clues = store.clues.filter(c => c.id !== id)
		uni.setStorageSync('clues', JSON.stringify(store.clues))
	},

	updateSendPlan(data) {
		store.sendPlan = Object.assign({}, store.sendPlan, data)
		uni.setStorageSync('plan', JSON.stringify(store.sendPlan))
	},

	setUser(user) {
		store.currentUser = user
		uni.setStorageSync('user', JSON.stringify(user))
	},

	logout() {
		store.currentUser = null
		uni.removeStorageSync('user')
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
		store.categoryOrder = order
		uni.setStorageSync('clueCategoryOrder', JSON.stringify(order))
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
	}
}
