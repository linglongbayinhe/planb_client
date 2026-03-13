<template>
	<view class="sheet-overlay" @tap.self="onClose">
		<view class="sheet-container" @tap.stop>
			<view class="drag-handle"></view>

			<!-- 导航栏 -->
			<view class="sheet-nav">
				<view class="nav-btn" @click="onClose">
					<text class="nav-cancel">取消</text>
				</view>
				<text class="sheet-title">{{ mode === 'login' ? '登录' : '注册' }}</text>
				<view style="min-width: 44px;"></view>
			</view>

			<scroll-view class="sheet-scroll" scroll-y>
				<!-- 模式切换 -->
				<view class="mode-switcher card">
					<view
						class="mode-tab"
						:class="{ 'mode-tab-active': mode === 'login' }"
						@click="mode = 'login'; clearError()"
					>
						<text class="mode-tab-text">登录</text>
					</view>
					<view
						class="mode-tab"
						:class="{ 'mode-tab-active': mode === 'register' }"
						@click="mode = 'register'; clearError()"
					>
						<text class="mode-tab-text">注册</text>
					</view>
				</view>

				<!-- 错误提示 -->
				<view v-if="errorMsg" class="error-banner">
					<text class="error-text">{{ errorMsg }}</text>
				</view>

				<!-- 表单 -->
				<view class="form-card card">
					<view class="form-row">
						<text class="form-label">邮箱</text>
						<input
							class="form-input"
							v-model="email"
							type="email"
							placeholder="输入邮箱..."
							placeholder-class="form-placeholder"
						/>
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">密码</text>
						<input
							class="form-input"
							v-model="password"
							type="password"
							placeholder="输入密码..."
							placeholder-class="form-placeholder"
						/>
					</view>

					<template v-if="mode === 'register'">
						<view class="form-divider"></view>
						<view class="form-row">
							<text class="form-label">确认密码</text>
							<input
								class="form-input"
								v-model="confirmPassword"
								type="password"
								placeholder="再次输入..."
								placeholder-class="form-placeholder"
							/>
						</view>
						<view v-if="confirmPasswordMismatch" class="field-error-row">
							<text class="field-error-text">密码与确认密码不一致</text>
						</view>
						<view class="form-divider"></view>
						<view class="form-row">
							<text class="form-label">昵称</text>
							<input
								class="form-input"
								v-model="nickname"
								placeholder="选填..."
								placeholder-class="form-placeholder"
							/>
						</view>
					</template>
				</view>

				<!-- 提交按钮 -->
				<view class="submit-btn-wrap">
					<view
						class="submit-btn"
						:class="{ 'submit-btn-disabled': !canSubmit }"
						@click="onSubmit"
					>
						<text class="submit-btn-text">{{ mode === 'login' ? '登录' : '注册' }}</text>
					</view>
				</view>

				<!-- 其他登录方式 -->
				<view class="oauth-section">
					<view class="oauth-divider">
						<view class="oauth-divider-line"></view>
						<text class="oauth-divider-text">其他登录方式</text>
						<view class="oauth-divider-line"></view>
					</view>
					<view class="oauth-btn-wrap">
						<view class="oauth-btn oauth-btn-wx" @click="wxLogin">
							<text class="oauth-btn-icon">微</text>
							<text class="oauth-btn-text">微信登录</text>
						</view>
						<view class="oauth-btn oauth-btn-qq" @click="qqLogin">
							<text class="oauth-btn-icon">Q</text>
							<text class="oauth-btn-text">QQ登录</text>
						</view>
					</view>
				</view>

				<!-- 底部说明 -->
				<text class="bottom-note">注册/登录后账户与发送设置将同步至云端。</text>

				<view style="height: 40px;"></view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import { store, mutations } from '../../store/index.js'

	export default {
		name: 'LoginRegisterSheet',
		emits: ['close'],
		data() {
			return {
				mode: 'login',
				email: '',
				password: '',
				confirmPassword: '',
				nickname: '',
				errorMsg: ''
			}
		},
		computed: {
			canSubmit() {
				if (!this.email.trim() || !this.password.trim()) return false
				if (this.mode === 'register') {
					return this.password.length >= 6 && this.password === this.confirmPassword
				}
				return true
			},
			confirmPasswordMismatch() {
				if (this.mode !== 'register') return false
				return this.confirmPassword.length > 0 && this.password !== this.confirmPassword
			}
		},
		methods: {
			onClose() {
				this.$emit('close')
			},
			clearError() {
				this.errorMsg = ''
				if (this.mode === 'login') {
					this.confirmPassword = ''
				}
			},
			isValidEmail(email) {
				return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
			},
			async onSubmit() {
				if (!this.canSubmit) return
				this.errorMsg = ''

				if (!this.isValidEmail(this.email)) {
					this.errorMsg = '邮箱格式无效'
					return
				}

				if (this.mode === 'login') {
					await this.doLogin()
				} else {
					if (this.password.length < 6) {
						this.errorMsg = '密码至少需要6位'
						return
					}
					if (this.password !== this.confirmPassword) {
						this.errorMsg = '密码与确认密码不一致'
						return
					}
					await this.doRegister()
				}
			},
			async doLogin() {
				uni.showLoading({ title: '登录中，请稍后...', mask: true })
				try {
					const obj = uniCloud.importObject('register', { customUI: true })
					const res = await obj.login(this.email.trim(), this.password)
					if (res.errCode === 0) {
						this.saveTokenAndUser(res.newToken, res.userInfo)
						this.$emit('close')
						// 登录成功后异步记录登录时间，不触发默认「加载中...」
						const uid = res.userInfo && res.userInfo._id
						if (uid) {
							uniCloud.importObject('login', { customUI: true }).recordLoginTime(uid).catch(() => {})
						}
					} else {
						this.errorMsg = res.errMsg || (res.errCode === 'USER_NOT_FOUND' ? '该邮箱尚未注册' : '登录失败')
					}
				} catch (e) {
					this.errorMsg = e.message || '网络异常，请重试'
				} finally {
					uni.hideLoading()
				}
			},
			async doRegister() {
				try {
					const obj = uniCloud.importObject('register')
					const res = await obj.registerUser(this.email.trim(), this.password, this.nickname)
					if (res.errCode === 0) {
						this.saveTokenAndUser(res.newToken, res.userInfo)
						this.$emit('close')
					} else {
						this.errorMsg = res.errMsg || (res.errCode === 'EMAIL_EXISTS' ? '该邮箱已注册' : '注册失败')
					}
				} catch (e) {
					this.errorMsg = e.message || '网络异常，请重试'
				}
			},
			saveTokenAndUser(newToken, userInfo) {
				if (newToken && newToken.token) {
					uni.setStorageSync('uni_id_token', newToken.token)
					if (newToken.tokenExpired != null) {
						uni.setStorageSync('uni_id_token_expired', newToken.tokenExpired)
					}
				}
				const u = userInfo || {}
				mutations.setUser({ _id: u._id, email: u.email || this.email, nickname: u.nickname || this.nickname })
			},
			getStoredUsers() {
				try {
					const v = uni.getStorageSync('users')
					return v ? JSON.parse(v) : []
				} catch (e) {
					return []
				}
			},
			
			async wxLogin() {
				try {
					const loginRes = await new Promise((resolve, reject) => {
						uni.login({
							provider: 'weixin',
							success: resolve,
							fail: reject
						})
					})
					if (loginRes && loginRes.code) {
						await this.sendCodeToBackend('weixin', loginRes.code)
					} else {
						uni.showToast({ title: '微信登录失败，未获取到 code', icon: 'none' })
					}
				} catch (e) {
					uni.showToast({ title: (e && e.errMsg) || '微信登录失败', icon: 'none' })
				}
			},
			async qqLogin() {
				try {
					const loginRes = await new Promise((resolve, reject) => {
						uni.login({
							provider: 'qq',
							success: resolve,
							fail: reject
						})
					})
					if (loginRes.code) {
						await this.sendCodeToBackend('qq', loginRes.code)
					} else {
						uni.showToast({ title: 'QQ登录失败，未获取到 code', icon: 'none' })
					}
				} catch (e) {
					uni.showToast({ title: e.errMsg || 'QQ登录失败', icon: 'none' })
				}
			},
			async sendCodeToBackend(provider, code) {
				uni.showLoading({ title: '登录中...', mask: true })
				try {
					if (provider === 'weixin') {
						// 微信登录：调用云函数 func_wechat_login
						const res = await uniCloud.callFunction({
							name: 'func_wechat_login',
							data: { code }
						})
						uni.hideLoading()
						const result = (res && res.result) || {}
						if (result.code === 0 && result.token) {
							this.saveTokenAndUser(
								{ token: result.token },
								result.userInfo || {}
							)
							this.$emit('close')
						} else {
							uni.showToast({ title: (result.message) || '微信登录失败', icon: 'none' })
						}
					} else {
						// QQ 登录：调用云对象 register.oauthLogin
						const obj = uniCloud.importObject('register', { customUI: true })
						const res = await obj.oauthLogin(provider, code)
						uni.hideLoading()
						if (res && res.errCode === 0) {
							this.saveTokenAndUser(res.newToken, res.userInfo)
							this.$emit('close')
						} else {
							uni.showToast({ title: (res && res.errMsg) || '登录失败', icon: 'none' })
						}
					}
				} catch (e) {
					uni.hideLoading()
					uni.showToast({ title: (e && e.message) || '网络异常，请重试', icon: 'none' })
				}
			}
		}
	}
</script>

<style scoped>
	.sheet-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.sheet-container {
		background-color: #F2F2F7;
		border-radius: 16px 16px 0 0;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.drag-handle {
		width: 36px; height: 5px;
		background-color: #C7C7CC;
		border-radius: 3px;
		margin: 10px auto 4px;
	}

	.sheet-nav {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px 12px;
	}

	.sheet-title {
		font-size: 17px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.nav-btn { min-width: 44px; }

	.nav-cancel {
		font-size: 17px;
		color: #8E8E93;
		background-color: #E5E5EA;
		padding: 6px 14px;
		border-radius: 20px;
	}

	.sheet-scroll { flex: 1; }

	.mode-switcher {
		margin: 0 16px 16px;
		background: #FFFFFF;
		border-radius: 12px;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	.mode-tab {
		flex: 1;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #F2F2F7;
	}

	.mode-tab-active {
		background-color: #FFFFFF;
		border-bottom: 2px solid #007AFF;
	}

	.mode-tab-text {
		font-size: 16px;
		font-weight: 500;
		color: #8E8E93;
	}

	.mode-tab-active .mode-tab-text {
		color: #1C1C1E;
	}

	.error-banner {
		margin: 0 16px 12px;
		background-color: #FFE5E5;
		border-radius: 10px;
		padding: 10px 14px;
	}

	.error-text {
		font-size: 14px;
		color: #C0392B;
	}

	.form-card {
		margin: 0 16px 16px;
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}

	.form-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 14px 16px;
		gap: 12px;
	}

	.form-label {
		font-size: 16px;
		color: #1C1C1E;
		min-width: 70px;
	}

	.form-input {
		flex: 1;
		font-size: 15px;
		color: #1C1C1E;
		background: transparent;
		border: none;
		outline: none;
	}

	.form-placeholder { color: #C7C7CC; }

	.form-divider {
		height: 0.5px;
		background-color: #E5E5EA;
		margin: 0 16px;
	}

	.field-error-row {
		padding: 4px 16px 8px;
		padding-left: calc(70px + 16px + 12px);
	}

	.field-error-text {
		font-size: 13px;
		color: #C0392B;
	}

	.submit-btn-wrap {
		padding: 0 16px 12px;
	}

	.submit-btn {
		width: 100%;
		height: 52px;
		background-color: #007AFF;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.submit-btn-disabled {
		opacity: 0.5;
	}

	.submit-btn-text {
		font-size: 17px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.oauth-section {
		margin: 16px 16px 0;
		padding: 0 0 8px;
	}

	.oauth-divider {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12px;
		margin-bottom: 14px;
	}

	.oauth-divider-line {
		flex: 1;
		height: 0.5px;
		background-color: #E5E5EA;
	}

	.oauth-divider-text {
		font-size: 13px;
		color: #8E8E93;
	}

	.oauth-btn-wrap {
		display: flex;
		flex-direction: row;
		gap: 12px;
	}

	.oauth-btn {
		flex: 1;
		height: 48px;
		border-radius: 12px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.oauth-btn-wx {
		background-color: #07C160;
	}

	.oauth-btn-qq {
		background-color: #12B7F5;
	}

	.oauth-btn-icon {
		font-size: 18px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.oauth-btn-text {
		font-size: 15px;
		font-weight: 500;
		color: #FFFFFF;
	}

	.bottom-note {
		font-size: 13px;
		color: #8E8E93;
		text-align: center;
		padding: 4px 20px;
	}
</style>
