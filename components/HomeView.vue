<template>
	<scroll-view class="home-page" scroll-y>
		<!-- 顶部状态栏占位 -->
		<view class="status-bar-placeholder" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 标题区 -->
		<view class="header-area">
			<view class="title-row">
				<text class="page-title">后手</text>
				<view class="status-badge" :class="planEnabled ? 'badge-active' : 'badge-paused'">
					<text class="badge-text">{{ planEnabled ? '已开启' : '已暂停' }}</text>
				</view>
			</view>
			<text class="page-subtitle">生活有备份 · 关键有交代</text>
		</view>

		<!-- 倒计时卡片 -->
		<view class="countdown-card card">
			<text class="countdown-label">距离预设发送还剩</text>

			<view class="days-row">
				<text class="days-number">{{ countdownDays }}</text>
				<text class="days-unit">天</text>
			</view>

			<view class="time-row">
				<view class="time-block">
					<text class="time-value">{{ timeStr.hh }}</text>
					<text class="time-unit">时</text>
				</view>
				<view class="time-block">
					<text class="time-value">{{ timeStr.mm }}</text>
					<text class="time-unit">分</text>
				</view>
				<view class="time-block">
					<text class="time-value">{{ timeStr.ss }}</text>
					<text class="time-unit">秒</text>
				</view>
			</view>

			<view class="send-date-row">
				<text class="send-date-icon">📅</text>
				<text class="send-date-text">预计日期：{{ formattedSendDate }}</text>
			</view>

			<view class="refresh-btn" @click="handleRefresh">
				<text class="refresh-icon">↺</text>
				<text class="refresh-text">刷新倒计时</text>
			</view>
		</view>

		<!-- 快捷入口 -->
		<text class="section-title">快捷入口</text>

		<view class="shortcuts-area">
			<!-- 线索库 -->
			<view class="shortcut-card card" @click="goToClues">
				<view class="shortcut-icon-wrap" style="background-color: #FFF3E0;">
					<text class="shortcut-icon">🗃️</text>
				</view>
				<view class="shortcut-info">
					<text class="shortcut-title">线索库</text>
					<text class="shortcut-desc">整理您的重要物品与数字资产</text>
				</view>
				<text class="shortcut-arrow">›</text>
			</view>

			<!-- 发送设置 -->
			<view class="shortcut-card card" @click="goToSend">
				<view class="shortcut-icon-wrap" style="background-color: #E3F0FF;">
					<text class="shortcut-icon">📤</text>
				</view>
				<view class="shortcut-info">
					<text class="shortcut-title">发送设置</text>
					<text class="shortcut-desc">配置收件人与通知触发逻辑</text>
				</view>
				<text class="shortcut-arrow">›</text>
			</view>
		</view>

		<!-- 底部间距 -->
		<view style="height: 24px;"></view>
	</scroll-view>
</template>

<script>
	import { store, mutations } from '../store/index.js'

	export default {
		name: 'HomeView',
		emits: ['switch-tab'],
		data() {
			return {
				statusBarHeight: 44,
				timer: null,
				now: new Date()
			}
		},
		computed: {
			planEnabled() {
				return store.sendPlan.enabled
			},
			sendDate() {
				return store.sendPlan.sendDate ? new Date(store.sendPlan.sendDate) : null
			},
			countdownDays() {
				if (!this.sendDate || !this.planEnabled) return '--'
				const diff = this.sendDate - this.now
				if (diff <= 0) return 0
				return Math.floor(diff / (1000 * 60 * 60 * 24))
			},
			timeStr() {
				if (!this.sendDate || !this.planEnabled) {
					return { hh: '--', mm: '--', ss: '--' }
				}
				const diff = this.sendDate - this.now
				if (diff <= 0) return { hh: '00', mm: '00', ss: '00' }
				const totalSecs = Math.floor(diff / 1000)
				const hh = Math.floor((totalSecs % 86400) / 3600)
				const mm = Math.floor((totalSecs % 3600) / 60)
				const ss = totalSecs % 60
				return {
					hh: String(hh).padStart(2, '0'),
					mm: String(mm).padStart(2, '0'),
					ss: String(ss).padStart(2, '0')
				}
			},
			formattedSendDate() {
				if (!this.sendDate || !this.planEnabled) return '暂未开启发送计划'
				const d = this.sendDate
				const year = d.getFullYear()
				const month = d.getMonth() + 1
				const day = d.getDate()
				const hours = d.getHours()
				const mins = String(d.getMinutes()).padStart(2, '0')
				const ampm = hours >= 12 ? 'PM' : 'AM'
				const h12 = hours % 12 || 12
				return `${year}年${month}月${day}日 ${h12}:${mins}${ampm}`
			}
		},
		onShow() {
			this.startTimer()
		},
		onHide() {
			this.stopTimer()
		},
		mounted() {
			uni.getSystemInfo({
				success: (info) => {
					this.statusBarHeight = info.statusBarHeight || 44
				}
			})
			this.startTimer()
		},
		beforeDestroy() {
			this.stopTimer()
		},
		methods: {
			startTimer() {
				if (this.timer) return
				this.timer = setInterval(() => {
					this.now = new Date()
				}, 1000)
			},
			stopTimer() {
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
				}
			},
			handleRefresh() {
				const intervalDays = store.sendPlan.intervalDays || 7
				const newSendDate = new Date()
				newSendDate.setDate(newSendDate.getDate() + intervalDays)
				mutations.updateSendPlan({ sendDate: newSendDate.toISOString() })
				this.now = new Date()
				uni.vibrateShort && uni.vibrateShort({ type: 'light' })
			},
			goToClues() {
				uni.vibrateShort && uni.vibrateShort({ type: 'light' })
				this.$emit('switch-tab', 1)
			},
			goToSend() {
				uni.vibrateShort && uni.vibrateShort({ type: 'light' })
				this.$emit('switch-tab', 2)
			}
		}
	}
</script>

<style scoped>
	.home-page {
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

	.title-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
		margin-bottom: 4px;
	}

	.page-title {
		font-size: 34px;
		font-weight: 700;
		color: #1C1C1E;
		line-height: 1.2;
	}

	.status-badge {
		padding: 2px 8px;
		border-radius: 20px;
	}

	.badge-active {
		background-color: #D1F2E1;
	}

	.badge-paused {
		background-color: #FFE5E5;
	}

	.badge-text {
		font-size: 12px;
		font-weight: 600;
	}

	.badge-active .badge-text {
		color: #1A7F3C;
	}

	.badge-paused .badge-text {
		color: #C0392B;
	}

	.page-subtitle {
		font-size: 15px;
		color: #8E8E93;
		margin-top: 2px;
	}

	.countdown-card {
		margin: 0 16px 16px;
		padding: 20px 20px 16px;
		background: #FFFFFF;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.countdown-label {
		font-size: 14px;
		color: #8E8E93;
		margin-bottom: 12px;
	}

	.days-row {
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		margin-bottom: 16px;
	}

	.days-number {
		font-size: 80px;
		font-weight: 700;
		color: #007AFF;
		line-height: 1;
	}

	.days-unit {
		font-size: 22px;
		color: #3C3C43;
		margin-bottom: 10px;
		margin-left: 4px;
	}

	.time-row {
		display: flex;
		flex-direction: row;
		gap: 10px;
		margin-bottom: 14px;
	}

	.time-block {
		background-color: #F2F2F7;
		border-radius: 8px;
		padding: 8px 14px;
		display: flex;
		flex-direction: row;
		align-items: baseline;
		gap: 2px;
	}

	.time-value {
		font-size: 20px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.time-unit {
		font-size: 12px;
		color: #8E8E93;
	}

	.send-date-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
		margin-bottom: 16px;
	}

	.send-date-icon {
		font-size: 14px;
	}

	.send-date-text {
		font-size: 14px;
		color: #6C6C70;
	}

	.refresh-btn {
		width: 100%;
		background-color: #007AFF;
		border-radius: 12px;
		height: 50px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.refresh-icon {
		font-size: 18px;
		color: #FFFFFF;
	}

	.refresh-text {
		font-size: 17px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.section-title {
		font-size: 13px;
		font-weight: 600;
		color: #6C6C70;
		text-transform: uppercase;
		padding: 0 20px 8px;
		letter-spacing: 0.5px;
	}

	.shortcuts-area {
		padding: 0 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.shortcut-card {
		background: #FFFFFF;
		border-radius: 12px;
		padding: 16px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 14px;
	}

	.shortcut-icon-wrap {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.shortcut-icon {
		font-size: 22px;
	}

	.shortcut-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.shortcut-title {
		font-size: 16px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.shortcut-desc {
		font-size: 13px;
		color: #8E8E93;
	}

	.shortcut-arrow {
		font-size: 20px;
		color: #C7C7CC;
		font-weight: 300;
	}
</style>
