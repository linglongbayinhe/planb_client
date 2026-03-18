<template>
	<view class="sheet-overlay" @tap.self="handleCancel">
		<view class="sheet-container" @tap.stop>
			<view class="drag-handle"></view>
			<view class="sheet-nav">
				<text class="sheet-title">授权登录</text>
			</view>
			<view class="sheet-content">
				<text class="desc-title">首次使用需要授权登录</text>
				<text class="desc-subtitle">授权后将自动同步你的发送设置与个人数据。</text>
				<view class="btn auth-btn" @click="handleAuthorize">
					<text class="btn-text">用户授权</text>
				</view>
				<view class="btn cancel-btn" @click="handleCancel">
					<text class="btn-text cancel-text">取消</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { mutations } from '../../store/index.js'

	export default {
		name: 'LoginRegisterSheet',
		props: {
			cancelMode: {
				type: String,
				default: 'close' // close | exit
			}
		},
		emits: ['close', 'success', 'cancel'],
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
			async handleAuthorize() {
				const provider = this.resolveProvider()
				if (!provider) {
					uni.showToast({ title: '当前平台授权登录暂未开通', icon: 'none' })
					return
				}
				uni.showLoading({ title: '授权中...', mask: true })
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
					const res = await obj.loginByProvider(provider, code, {})
					if (!res || res.code !== 0 || !res.token) {
						console.error('[auth_provider/loginByProvider] fail result:', res)
						throw new Error((res && res.message) || '授权登录失败')
					}
					mutations.saveAuthToken({
						token: res.token,
						tokenExpired: res.tokenExpired
					})
					const profileObj = uniCloud.importObject('user_profile', { customUI: true })
					const profileRes = await profileObj.getBootstrap()
					if (profileRes && profileRes.errCode === 0) {
						mutations.applyUserBootstrap({
							user: profileRes.userInfo,
							plan: profileRes.plan
						})
					} else if (res.userInfo) {
						mutations.setUser({
							_id: res.userInfo._id,
							email: res.userInfo.email || '',
							nickname: res.userInfo.nickname || '',
							avatar: res.userInfo.avatar || ''
						})
					}
					this.$emit('success')
					this.$emit('close')
				} catch (e) {
					uni.showToast({ title: (e && e.message) || '授权登录失败', icon: 'none' })
				} finally {
					uni.hideLoading()
				}
			},
			handleCancel() {
				this.$emit('cancel')
				if (this.cancelMode === 'exit') {
					if (typeof uni.exitMiniProgram === 'function') {
						uni.exitMiniProgram({
							fail: () => {
								uni.showToast({ title: '已取消登录', icon: 'none' })
							}
						})
					} else {
						uni.showToast({ title: '已取消登录', icon: 'none' })
					}
				} else {
					this.$emit('close')
				}
			}
		}
	}
</script>

<style scoped>
	.sheet-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.sheet-container {
		background-color: #F2F2F7;
		border-radius: 16px 16px 0 0;
		padding: 0 16px calc(env(safe-area-inset-bottom, 0px) + 20px);
	}
	.drag-handle {
		width: 36px;
		height: 5px;
		background-color: #C7C7CC;
		border-radius: 3px;
		margin: 10px auto 12px;
	}
	.sheet-nav {
		display: flex;
		justify-content: center;
		padding-bottom: 16px;
	}
	.sheet-title {
		font-size: 18px;
		font-weight: 600;
		color: #1C1C1E;
	}
	.sheet-content {
		background: #FFFFFF;
		border-radius: 12px;
		padding: 20px 14px 14px;
	}
	.desc-title {
		font-size: 18px;
		font-weight: 600;
		color: #1C1C1E;
		text-align: center;
	}
	.desc-subtitle {
		margin-top: 8px;
		font-size: 14px;
		line-height: 1.5;
		color: #6C6C70;
		text-align: center;
	}
	.btn {
		height: 50px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 12px;
	}
	.auth-btn {
		background-color: #07C160;
	}
	.cancel-btn {
		background-color: #E5E5EA;
	}
	.btn-text {
		font-size: 17px;
		font-weight: 600;
		color: #FFFFFF;
	}
	.cancel-text {
		color: #3C3C43;
	}
</style>
