<template>
	<view class="sheet-overlay" @click.self="onClose">
		<view class="sheet-container">
			<view class="drag-handle"></view>

			<!-- 导航栏 -->
			<view class="sheet-nav">
				<view style="min-width: 44px;"></view>
				<text class="sheet-title">语言设置</text>
				<view class="nav-btn" @click="onClose">
					<text class="nav-done">完成</text>
				</view>
			</view>

			<scroll-view class="sheet-scroll" scroll-y>
				<!-- 说明 -->
				<view class="hint-banner">
					<text class="hint-icon">ℹ️</text>
					<text class="hint-text">选择您偏好的界面语言</text>
				</view>

				<!-- 语言列表 -->
				<view class="lang-list card">
					<view
						v-for="(lang, i) in languages"
						:key="lang.key"
					>
						<view
							class="lang-row"
							@click="selectLanguage(lang.key)"
						>
							<view class="lang-flag-wrap">
								<text class="lang-flag">{{ lang.flag }}</text>
							</view>
							<view class="lang-info">
								<text class="lang-name">{{ lang.name }}</text>
								<text class="lang-name-en">{{ lang.nameEn }}</text>
							</view>
							<view v-if="currentLanguage === lang.key" class="check-icon">
								<text class="check-text">✓</text>
							</view>
						</view>
						<view v-if="i < languages.length - 1" class="lang-divider"></view>
					</view>
				</view>

				<view style="height: 40px;"></view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import { store, mutations } from '../../store/index.js'

	export default {
		name: 'LanguagePickerSheet',
		emits: ['close'],
		data() {
			return {
				languages: [
					{ key: 'zh-CN', name: '简体中文', nameEn: 'Simplified Chinese', flag: '🇨🇳' },
					{ key: 'zh-TW', name: '繁體中文', nameEn: 'Traditional Chinese', flag: '🇹🇼' },
					{ key: 'en', name: 'English', nameEn: 'English', flag: '🇺🇸' },
					{ key: 'ja', name: '日本語', nameEn: 'Japanese', flag: '🇯🇵' },
					{ key: 'ko', name: '한국어', nameEn: 'Korean', flag: '🇰🇷' }
				]
			}
		},
		computed: {
			currentLanguage() {
				return store.language
			}
		},
		methods: {
			selectLanguage(key) {
				mutations.setLanguage(key)
				uni.vibrateShort && uni.vibrateShort({ type: 'light' })
				setTimeout(() => {
					this.$emit('close')
				}, 300)
			},
			onClose() {
				this.$emit('close')
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
		max-height: 80vh;
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

	.nav-btn { min-width: 44px; text-align: right; }

	.nav-done {
		font-size: 17px;
		color: #007AFF;
		font-weight: 600;
		background-color: #E5E5EA;
		padding: 6px 14px;
		border-radius: 20px;
	}

	.sheet-scroll { flex: 1; }

	.hint-banner {
		margin: 0 16px 14px;
		background-color: #EEF4FF;
		border-radius: 10px;
		padding: 10px 14px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
	}

	.hint-icon { font-size: 14px; }

	.hint-text {
		font-size: 14px;
		color: #3A6EA5;
	}

	.lang-list {
		margin: 0 16px;
		background: #FFFFFF;
		border-radius: 14px;
		overflow: hidden;
	}

	.lang-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 14px 16px;
		gap: 14px;
	}

	.lang-flag-wrap {
		width: 40px; height: 30px;
		border-radius: 4px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lang-flag { font-size: 24px; }

	.lang-info { flex: 1; }

	.lang-name {
		font-size: 16px;
		font-weight: 500;
		color: #1C1C1E;
	}

	.lang-name-en {
		font-size: 13px;
		color: #8E8E93;
		margin-top: 2px;
	}

	.check-icon {
		width: 24px; height: 24px;
		background-color: #007AFF;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.check-text {
		font-size: 13px;
		color: #FFFFFF;
		font-weight: 700;
	}

	.lang-divider {
		height: 0.5px;
		background-color: #E5E5EA;
		margin-left: 70px;
	}
</style>
