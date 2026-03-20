<template>
	<scroll-view class="settings-page" scroll-y>
		<!-- 顶部状态栏占位 -->
		<view class="status-bar-placeholder" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 标题 -->
		<view class="header-area">
			<text class="page-title">设置</text>
		</view>

		<!-- 账户卡片 -->
		<view class="account-card card" @click="onAccountTap">
			<view class="account-avatar">
				<image v-if="currentUser && currentUser.avatar" class="account-avatar-img" :src="currentUser.avatar" mode="aspectFill" />
				<text v-else class="account-avatar-icon">👤</text>
			</view>
			<view class="account-info">
				<text v-if="currentUser" class="account-name">{{ currentUser.nickname || currentUser.email || '已登录' }}</text>
				<text v-if="currentUser && currentUser.email" class="account-email">{{ currentUser.email }}</text>
				<text v-if="currentUser && !currentUser.email" class="account-email">微信用户</text>
				<text v-if="!currentUser" class="account-login-title">登录 / 注册</text>
				<text v-if="!currentUser" class="account-login-desc">线索仅加密存储于本设备</text>
			</view>
			<view v-if="currentUser" class="logout-btn" @click.stop="confirmLogout">
				<text class="logout-text">退出</text>
			</view>
			<text v-else class="settings-arrow">›</text>
		</view>

		<!-- 通用设置 -->
		<text class="section-header">设置</text>

		<view class="settings-group card">
			<!-- 主题风格 -->
			<view class="settings-row" @click="showThemePicker = true">
				<view class="settings-row-icon-wrap" style="background-color: #F0EBFF;">
					<text class="settings-row-icon">✦</text>
				</view>
				<text class="settings-row-title">主题风格</text>
				<text class="settings-row-value">{{ themeLabel }}</text>
				<text class="settings-arrow">›</text>
			</view>

			<view class="settings-divider"></view>

			<!-- 语言 -->
			<view class="settings-row" @click="showLanguagePicker = true">
				<view class="settings-row-icon-wrap" style="background-color: #E8F8E8;">
					<text class="settings-row-icon">🌐</text>
				</view>
				<text class="settings-row-title">语言</text>
				<text class="settings-row-value">{{ languageLabel }}</text>
				<text class="settings-arrow">›</text>
			</view>

			<view class="settings-divider"></view>

			<!-- FaceID -->
			<view class="settings-row">
				<view class="settings-row-icon-wrap" style="background-color: #E8F0FF;">
					<text class="settings-row-icon">🆔</text>
				</view>
				<text class="settings-row-title">FaceID 安全锁定</text>
				<view class="pro-badge">
					<text class="pro-text">PRO</text>
				</view>
			</view>

			<view class="settings-divider"></view>

			<!-- 使用指南 -->
			<view class="settings-row">
				<view class="settings-row-icon-wrap" style="background-color: #E8F4FF;">
					<text class="settings-row-icon">❓</text>
				</view>
				<text class="settings-row-title">使用指南 & 常见问题</text>
				<text class="settings-arrow">›</text>
			</view>

			<view class="settings-divider"></view>

			<!-- 关于 -->
			<view class="settings-row">
				<view class="settings-row-icon-wrap" style="background-color: #F0F0F0;">
					<text class="settings-row-icon">ℹ️</text>
				</view>
				<text class="settings-row-title">关于后手 v1.0</text>
				<text class="settings-arrow">›</text>
			</view>
		</view>

		<!-- 重置按钮 -->
		<view class="reset-card card" @click="confirmReset">
			<view class="settings-row-icon-wrap" style="background-color: #FFE5E5;">
				<text class="settings-row-icon">🗑</text>
			</view>
			<text class="reset-text">重置并删除本地数据</text>
		</view>

		<!-- 底部 Slogan -->
		<view class="slogan-area">
			<text class="slogan-line">PLAN B · SECURE DATA</text>
			<text class="slogan-line">100% LOCAL PROCESSING · NO CLOUD</text>
		</view>

		<view style="height: 24px;"></view>

		<!-- Sheets -->
		<LoginRegisterSheet
			v-if="showLoginSheet"
			@close="showLoginSheet = false"
		/>

		<ThemePickerSheet
			v-if="showThemePicker"
			@close="showThemePicker = false"
		/>

		<LanguagePickerSheet
			v-if="showLanguagePicker"
			@close="showLanguagePicker = false"
		/>
	</scroll-view>
</template>

<script>
	import { store, mutations } from '../store/index.js'
	import LoginRegisterSheet from './sheets/LoginRegisterSheet.vue'
	import ThemePickerSheet from './sheets/ThemePickerSheet.vue'
	import LanguagePickerSheet from './sheets/LanguagePickerSheet.vue'

	const THEME_LABELS = {
		minimal: '极简风格',
		nightlight: '夜航灯塔'
	}

	const LANGUAGE_LABELS = {
		'zh-CN': '简体中文',
		'zh-TW': '繁體中文',
		'en': 'English',
		'ja': '日本語',
		'ko': '한국어'
	}

	export default {
		name: 'SettingsView',
		components: {
			LoginRegisterSheet,
			ThemePickerSheet,
			LanguagePickerSheet
		},
		data() {
			return {
				statusBarHeight: 44,
				showLoginSheet: false,
				showThemePicker: false,
				showLanguagePicker: false
			}
		},
		computed: {
			currentUser() {
				return store.currentUser
			},
			themeLabel() {
				return THEME_LABELS[store.theme] || '极简风格'
			},
			languageLabel() {
				return LANGUAGE_LABELS[store.language] || '简体中文'
			}
		},
		mounted() {
			try {
				const info = (typeof uni.getWindowInfo === 'function') ? uni.getWindowInfo() : null
				this.statusBarHeight = (info && info.statusBarHeight) || 44
			} catch (e) {
				this.statusBarHeight = 44
			}
			if (typeof uni !== 'undefined' && typeof uni.$on === 'function') {
				uni.$on('open-login-sheet', this.openLoginSheet)
			}
		},
		beforeDestroy() {
			if (typeof uni !== 'undefined' && typeof uni.$off === 'function') {
				uni.$off('open-login-sheet', this.openLoginSheet)
			}
		},
		methods: {
			openLoginSheet() {
				this.showLoginSheet = true
			},
			onAccountTap() {
				if (!this.currentUser) {
					this.openLoginSheet()
				}
			},
			confirmLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确定要退出当前账号吗？',
					confirmColor: '#FF3B30',
					success: (res) => {
						if (res.confirm) {
							mutations.logout()
						}
					}
				})
			},
			confirmReset() {
				if (!this.currentUser) {
					this.openLoginSheet()
					return
				}
				uni.showModal({
					title: '重置并删除本地数据',
					content: '此操作将清除所有线索和发送计划，不可恢复。确定继续？',
					confirmColor: '#FF3B30',
					confirmText: '删除',
					success: (res) => {
						if (res.confirm) {
							mutations.resetAll()
						}
					}
				})
			}
		}
	}
</script>

<style scoped>
	.settings-page {
		width: 100%;
		height: 100%;
		background-color: #F2F2F7;
	}

	.status-bar-placeholder {
		width: 100%;
	}

	.header-area {
		padding: 8px 20px 16px;
	}

	.page-title {
		font-size: 34px;
		font-weight: 700;
		color: #1C1C1E;
	}

	.account-card {
		margin: 0 16px 20px;
		background: #FFFFFF;
		border-radius: 14px;
		padding: 16px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 14px;
	}

	.account-avatar {
		width: 52px;
		height: 52px;
		background-color: #E5E5EA;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.account-avatar-icon {
		font-size: 26px;
	}

	.account-avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.account-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.account-name {
		font-size: 17px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.account-email {
		font-size: 14px;
		color: #8E8E93;
	}

	.account-login-title {
		font-size: 17px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.account-login-desc {
		font-size: 13px;
		color: #8E8E93;
	}

	.logout-btn {
		padding: 6px 14px;
		background-color: #F2F2F7;
		border-radius: 8px;
	}

	.logout-text {
		font-size: 15px;
		color: #FF3B30;
	}

	.settings-arrow {
		font-size: 20px;
		color: #C7C7CC;
	}

	.section-header {
		font-size: 13px;
		font-weight: 500;
		color: #6C6C70;
		padding: 0 20px 6px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.settings-group {
		margin: 0 16px 16px;
		background: #FFFFFF;
		border-radius: 14px;
		overflow: hidden;
	}

	.settings-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 12px 16px;
		gap: 12px;
	}

	.settings-row-icon-wrap {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.settings-row-icon {
		font-size: 16px;
	}

	.settings-row-title {
		font-size: 16px;
		color: #1C1C1E;
		flex: 1;
	}

	.settings-row-value {
		font-size: 15px;
		color: #8E8E93;
	}

	.settings-divider {
		height: 0.5px;
		background-color: #E5E5EA;
		margin-left: 60px;
	}

	.pro-badge {
		background-color: #E5E5EA;
		border-radius: 6px;
		padding: 2px 8px;
	}

	.pro-text {
		font-size: 12px;
		font-weight: 600;
		color: #8E8E93;
	}

	.reset-card {
		margin: 0 16px 20px;
		background: #FFFFFF;
		border-radius: 14px;
		padding: 14px 16px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12px;
	}

	.reset-text {
		font-size: 16px;
		color: #FF3B30;
		font-weight: 500;
	}

	.slogan-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px 20px 0;
		gap: 4px;
	}

	.slogan-line {
		font-size: 11px;
		color: #C7C7CC;
		letter-spacing: 1px;
		font-weight: 500;
	}
</style>
