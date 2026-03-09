<template>
	<view class="sheet-overlay" @click.self="onClose">
		<view class="sheet-container">
			<view class="drag-handle"></view>

			<!-- 导航栏 -->
			<view class="sheet-nav">
				<view style="min-width: 44px;"></view>
				<text class="sheet-title">主题风格</text>
				<view class="nav-btn" @click="onClose">
					<text class="nav-done">完成</text>
				</view>
			</view>

			<scroll-view class="sheet-scroll" scroll-y>
				<!-- 说明 -->
				<view class="hint-banner">
					<text class="hint-icon">✦</text>
					<text class="hint-text">选择您喜欢的界面风格</text>
				</view>

				<!-- 主题列表 -->
				<view
					v-for="theme in themes"
					:key="theme.key"
					class="theme-item"
					:class="{ 'theme-item-selected': currentTheme === theme.key }"
					@click="selectTheme(theme.key)"
				>
					<!-- 主题预览卡片 -->
					<view class="theme-preview" :class="'preview-' + theme.key">
						<text class="preview-days">{{ previewDays }}天</text>
						<view class="preview-btn" :class="'preview-btn-' + theme.key">
							<text class="preview-btn-text">刷新倒计时</text>
						</view>
						<view class="preview-time-row">
							<view class="preview-time-block" :class="'time-block-' + theme.key"></view>
							<view class="preview-time-block" :class="'time-block-' + theme.key"></view>
						</view>
					</view>

					<!-- 主题信息 -->
					<view class="theme-info-row">
						<view class="theme-icon-wrap" :style="{ backgroundColor: theme.iconBg }">
							<text class="theme-icon">{{ theme.icon }}</text>
						</view>
						<view class="theme-info">
							<text class="theme-name">{{ theme.name }}</text>
							<text class="theme-desc">{{ theme.desc }}</text>
						</view>
						<view v-if="currentTheme === theme.key" class="check-icon">
							<text class="check-text">✓</text>
						</view>
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
		name: 'ThemePickerSheet',
		emits: ['close'],
		data() {
			return {
				previewDays: 29,
				themes: [
					{
						key: 'minimal',
						name: '极简风格',
						desc: '简洁明快，清爽自然',
						icon: '✦',
						iconBg: '#F0EBFF'
					},
					{
						key: 'nightlight',
						name: '夜航灯塔',
						desc: '深蓝主调，沉稳可信',
						icon: '🔦',
						iconBg: '#E8F0FF'
					}
				]
			}
		},
		computed: {
			currentTheme() {
				return store.theme
			}
		},
		methods: {
			selectTheme(key) {
				mutations.setTheme(key)
				uni.vibrateShort && uni.vibrateShort({ type: 'light' })
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
		max-height: 88vh;
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

	.hint-icon { font-size: 14px; color: #5856D6; }

	.hint-text {
		font-size: 14px;
		color: #3A6EA5;
	}

	.theme-item {
		margin: 0 16px 12px;
		background: #FFFFFF;
		border-radius: 16px;
		overflow: hidden;
		border: 2px solid transparent;
	}

	.theme-item-selected {
		border-color: #007AFF;
	}

	.theme-preview {
		padding: 20px 20px 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.preview-minimal {
		background-color: #F2F2F7;
	}

	.preview-nightlight {
		background-color: #1A2744;
	}

	.preview-days {
		font-size: 36px;
		font-weight: 700;
		color: #007AFF;
	}

	.preview-nightlight .preview-days {
		color: #FFFFFF;
	}

	.preview-btn {
		padding: 8px 24px;
		border-radius: 10px;
	}

	.preview-btn-minimal { background-color: #007AFF; }
	.preview-btn-nightlight { background-color: #4A6FA5; }

	.preview-btn-text {
		font-size: 14px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.preview-time-row {
		display: flex;
		flex-direction: row;
		gap: 8px;
	}

	.preview-time-block {
		width: 48px;
		height: 28px;
		border-radius: 6px;
	}

	.time-block-minimal { background-color: #E5E5EA; }
	.time-block-nightlight { background-color: rgba(255,255,255,0.15); }

	.theme-info-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 14px 16px;
		gap: 12px;
		border-top: 0.5px solid #E5E5EA;
	}

	.theme-icon-wrap {
		width: 36px; height: 36px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.theme-icon { font-size: 18px; }

	.theme-info { flex: 1; }

	.theme-name {
		font-size: 16px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.theme-desc {
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
</style>
