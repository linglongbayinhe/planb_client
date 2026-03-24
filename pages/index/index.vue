<template>
	<view class="app-root">
		<!-- 各Tab内容区域 -->
		<view class="tab-content">
			<HomeView v-show="currentTab === 0" @switch-tab="switchTab" />
			<CluesView v-show="currentTab === 1" />
			<SendView v-show="currentTab === 2" />
			<SettingsView v-show="currentTab === 3" />
		</view>

		<!-- 自定义底部导航栏 -->
		<view class="tab-bar" :style="{ paddingBottom: safeAreaBottom + 'px' }">
			<view
				v-for="(tab, i) in tabs"
				:key="i"
				class="tab-item"
				:class="{ active: currentTab === i }"
				@click="switchTab(i)"
			>
				<image
					:src="currentTab === i ? tab.iconActive : tab.icon"
					class="tab-icon"
					mode="aspectFit"
				/>
				<text class="tab-label" :class="{ 'tab-label-active': currentTab === i }">{{ tab.label }}</text>
			</view>
		</view>

		<view v-if="booting" class="startup-mask">
			<view class="startup-card">
				<text class="startup-title">正在初始化</text>
				<text class="startup-desc">请稍候...</text>
			</view>
		</view>

		<view v-else-if="showAuthGate" class="startup-mask">
			<view class="startup-card">
				<text class="startup-title">欢迎使用后手</text>
				<text class="startup-desc">请先完成平台授权登录以同步你的账号数据。</text>
				<view class="gate-btn gate-btn-auth" @click="handleAuthorize">
					<text class="gate-btn-text">用户授权</text>
				</view>
				<view class="gate-btn gate-btn-cancel" @click="handleCancel">
					<text class="gate-btn-cancel-text">取消</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import HomeView from '../../components/HomeView.vue'
	import CluesView from '../../components/CluesView.vue'
	import SendView from '../../components/SendView.vue'
	import SettingsView from '../../components/SettingsView.vue'
	import { store, mutations } from '../../store/index.js'

	export default {
		components: {
			HomeView,
			CluesView,
			SendView,
			SettingsView
		},
		data() {
			return {
				currentTab: 0,
				safeAreaBottom: 0,
				booting: true,
				showAuthGate: false,
				authLoading: false,
				// Tab 图标须用 PNG（微信小程序 image 用 SVG 易导致启动报错 [] [object Object]）
				// 若已添加 home/clues/send/settings 的 png，可改为对应路径；否则先用 play/pause 占位
				tabs: [
					{ label: '首页', icon: '/static/icons/home.png', iconActive: '/static/icons/home-active.png' },
					{ label: '线索库', icon: '/static/icons/clues.png', iconActive: '/static/icons/clues-active.png' },
					{ label: '发送', icon: '/static/icons/send.png', iconActive: '/static/icons/send-active.png' },
					{ label: '设置', icon: '/static/icons/settings.png', iconActive: '/static/icons/settings-active.png' }
				]
			}
		},
		onLoad() {
			try {
				const info = (typeof uni.getWindowInfo === 'function') ? uni.getWindowInfo() : null
				this.safeAreaBottom = (info && info.safeAreaInsets && info.safeAreaInsets.bottom) || 0
			} catch (e) {
				this.safeAreaBottom = 0
			}
			this.bootstrapLogin()
			if (typeof uni !== 'undefined' && typeof uni.$on === 'function') {
				uni.$on('require-login', this.requireLoginThenOpenSettings)
			}
		},
		onUnload() {
			if (typeof uni !== 'undefined' && typeof uni.$off === 'function') {
				uni.$off('require-login', this.requireLoginThenOpenSettings)
			}
		},
		onShow() {
			if (!store.currentUser && !this.booting && !mutations.hasValidSession()) {
				this.showAuthGate = true
			}
		},
		methods: {
			resolveProvider() {
				let provider = ''
				// #ifdef MP-WEIXIN
				provider = 'weixin'
				// #endif
				// #ifdef MP-TOUTIAO
				provider = 'toutiao'
				// #endif
				// #ifdef MP-XHS
				provider = 'xiaohongshu'
				// #endif
				return provider
			},
			async bootstrapLogin() {
				this.booting = true
				this.showAuthGate = false
				if (mutations.hasValidSession()) {
					const ok = await this.pullBootstrapFromCloud()
					if (ok) {
						this.booting = false
						return
					}
				}
				mutations.clearAuthSession()
				await this.$nextTick()
				await this.handleAuthorize({ skipLoading: true })
				this.booting = false
				if (!store.currentUser) {
					this.showAuthGate = true
				}
			},
			async pullBootstrapFromCloud() {
				try {
					const obj = uniCloud.importObject('user_profile', { customUI: true })
					const res = await obj.getBootstrap()
					if (!res || res.errCode !== 0) return false
					mutations.applyUserBootstrap({
						user: res.userInfo,
						plan: res.plan
					})
					return true
				} catch (e) {
					return false
				}
			},
			async handleAuthorize(opts) {
				const skipLoading = !!(opts && opts.skipLoading)
				if (this.authLoading) return
				const provider = this.resolveProvider()
				if (!provider) {
					uni.showToast({ title: '当前平台授权登录暂未开通', icon: 'none' })
					return
				}
				this.authLoading = true
				if (!skipLoading) {
					uni.showLoading({ title: '授权中...', mask: true })
				}
				try {
					const loginRes = await new Promise((resolve, reject) => {
						uni.login({
							provider,
							success: resolve,
							fail: reject
						})
					})
					const code = loginRes && loginRes.code
					if (!code) throw new Error('未获取到登录凭证')
					const obj = uniCloud.importObject('auth_provider', { customUI: true })
					const result = await obj.loginByProvider(provider, code, {})
					if (!result || result.code !== 0 || !result.token) {
						console.error('[auth_provider/loginByProvider] fail result:', result)
						throw new Error((result && result.message) || '授权登录失败')
					}
					mutations.saveAuthToken({
						token: result.token,
						tokenExpired: result.tokenExpired
					})
					const ok = await this.pullBootstrapFromCloud()
					if (!ok) throw new Error('初始化用户数据失败，请重试')
					this.showAuthGate = false
				} catch (e) {
					mutations.clearAuthSession()
					uni.showToast({ title: (e && e.message) || '授权登录失败', icon: 'none' })
				} finally {
					this.authLoading = false
					if (!skipLoading) {
						uni.hideLoading()
					}
				}
			},
			handleCancel() {
				if (typeof uni.exitMiniProgram === 'function') {
					uni.exitMiniProgram({
						fail: () => {
							uni.showToast({ title: '已取消登录', icon: 'none' })
						}
					})
				} else {
					uni.showToast({ title: '已取消登录', icon: 'none' })
				}
			},
			requireLoginThenOpenSettings() {
				if (this.booting) return
				this.currentTab = 3
				if (typeof uni !== 'undefined' && typeof uni.$emit === 'function') {
					uni.$emit('open-login-sheet')
				}
			},
			switchTab(index) {
				if (this.showAuthGate || this.booting) return
				this.currentTab = index
			}
		}
	}
</script>

<style>
	.app-root {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #F2F2F7;
		overflow: hidden;
	}

	.tab-content {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.tab-bar {
		display: flex;
		flex-direction: row;
		background-color: rgba(249, 249, 249, 0.94);
		border-top: 0.5px solid rgba(60, 60, 67, 0.18);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 8px 0 4px;
		cursor: pointer;
	}

	.tab-icon {
		width: 26px;
		height: 26px;
		margin-bottom: 3px;
	}

	.tab-label {
		font-size: 10px;
		color: #8E8E93;
		font-weight: 400;
		line-height: 1;
	}

	.tab-label-active {
		color: #007AFF;
	}

	.startup-mask {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.38);
	}

	.startup-card {
		width: 76%;
		background: #FFFFFF;
		border-radius: 14px;
		padding: 20px 16px 16px;
	}

	.startup-title {
		font-size: 20px;
		font-weight: 700;
		color: #1C1C1E;
		text-align: center;
	}

	.startup-desc {
		margin-top: 10px;
		font-size: 14px;
		color: #6C6C70;
		text-align: center;
		line-height: 1.5;
	}

	.gate-btn {
		height: 48px;
		border-radius: 12px;
		margin-top: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.gate-btn-auth {
		background-color: #07C160;
	}

	.gate-btn-cancel {
		background-color: #E5E5EA;
	}

	.gate-btn-text {
		font-size: 16px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.gate-btn-cancel-text {
		font-size: 16px;
		font-weight: 500;
		color: #3C3C43;
	}
</style>
