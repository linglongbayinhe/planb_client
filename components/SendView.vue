<template>
	<scroll-view class="send-page" scroll-y>
		<!-- 顶部状态栏占位 -->
		<view class="status-bar-placeholder" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 标题栏 -->
		<view class="header-area">
			<view class="title-row">
				<text class="page-title">发送设置</text>
				<view class="status-badge" :class="planEnabled ? 'badge-active' : 'badge-paused'">
					<text class="badge-text">{{ planEnabled ? '已开启' : '已暂停' }}</text>
				</view>
			</view>
		</view>

		<!-- 收件联系人 -->
		<view class="section-label-row">
			<text class="section-icon">👤</text>
			<text class="section-label">收件联系人</text>
		</view>

		<view class="contacts-card card">
			<!-- 邮箱输入 -->
			<view class="input-row">
				<input
					class="contact-input"
					v-model="emailInput"
					placeholder="添加邮箱"
					placeholder-class="input-placeholder"
					type="email"
					:maxlength="100"
				/>
				<view
					class="add-contact-btn"
					:class="{ 'add-contact-btn-disabled': !emailInput.trim() || emails.length >= 3 }"
					@click="addEmail"
				>
					<text class="add-contact-icon">+</text>
				</view>
			</view>

			<!-- 邮箱分割线 -->
			<view class="divider"></view>

			<!-- 手机号输入 -->
			<view class="input-row">
				<input
					class="contact-input"
					v-model="phoneInput"
					placeholder="添加手机号"
					placeholder-class="input-placeholder"
					type="number"
					:maxlength="20"
				/>
				<view
					class="add-contact-btn"
					:class="{ 'add-contact-btn-disabled': !phoneInput.trim() || phones.length >= 3 }"
					@click="addPhone"
				>
					<text class="add-contact-icon">+</text>
				</view>
			</view>

			<!-- 已添加的邮箱列表 -->
			<view v-for="(email, i) in emails" :key="'e'+i">
				<view class="divider"></view>
				<view class="contact-item">
					<text class="contact-type-icon">✉️</text>
					<text class="contact-value">{{ email }}</text>
					<view class="delete-btn" @click="removeEmail(i)">
						<text class="delete-icon">✕</text>
					</view>
				</view>
			</view>

			<!-- 已添加的手机号列表 -->
			<view v-for="(phone, i) in phones" :key="'p'+i">
				<view class="divider"></view>
				<view class="contact-item">
					<text class="contact-type-icon">📱</text>
					<text class="contact-value">{{ phone }}</text>
					<view class="delete-btn" @click="removePhone(i)">
						<text class="delete-icon">✕</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 展示姓名 -->
		<view class="info-card card">
			<view class="info-row">
				<text class="info-icon">🔗</text>
				<text class="info-label">展示姓名</text>
				<input
					class="info-value-input"
					v-model="displayName"
					placeholder="未设置"
					placeholder-class="input-placeholder"
					@blur="saveDisplayName"
				/>
			</view>
		</view>

		<!-- 通知正文 -->
		<view class="notify-card card">
			<view class="notify-header" @click="toggleNotifyExpand">
				<text class="info-icon">📄</text>
				<text class="notify-title">通知正文</text>
				<text class="notify-preview-link">查看内容预览</text>
				<text class="notify-chevron">{{ notifyExpanded ? '∧' : '∨' }}</text>
			</view>

			<view v-if="notifyExpanded" class="notify-content">
				<view class="divider"></view>
				<view class="notify-text-area">
					<text class="notify-line">你好，</text>
					<text class="notify-line">
						如果你收到了这条通知，<text class="notify-name">{{ displayName || '（未设置）' }}</text> 可能暂时无法亲自与你联系。
					</text>
					<text class="notify-line">
						<text class="notify-name">{{ displayName || '（未设置）' }}</text> 在 Plan B（后手）App 中预留了一份「人生备份计划」。
					</text>
					<text class="notify-line">查找线索：请从</text>
					<textarea
						class="guide-textarea"
						v-model="customGuide"
						placeholder="填写查找线索的起始指引..."
						placeholder-class="input-placeholder"
						:auto-height="true"
						@blur="saveCustomGuide"
					/>
					<text class="notify-line">开始查找。</text>
					<text class="notify-line">谢谢你的帮助。</text>
					<text class="notify-line notify-signature">—— Plan B（后手）</text>
					<view class="notify-hint">
						<text class="notify-hint-icon">ℹ️</text>
						<text class="notify-hint-text">蓝紫色文字由系统自动生成，仅需编辑方框内的「第一步」指引。</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 触发周期 -->
		<view class="trigger-card card">
			<view class="trigger-header">
				<text class="trigger-title">触发周期</text>
				<view class="trigger-date-row">
					<text class="trigger-date-icon">📅</text>
					<text class="trigger-date-text">预计日期：{{ formattedSendDate }}</text>
				</view>
				<text class="trigger-days">{{ intervalDays }}天</text>
			</view>
			<slider
				class="trigger-slider"
				:value="intervalDays"
				:min="7"
				:max="365"
				:step="1"
				activeColor="#007AFF"
				backgroundColor="#E5E5EA"
				block-color="#FFFFFF"
				block-size="24"
				@change="onSliderChange"
				@changing="onSliderChanging"
			/>
			<view class="slider-labels">
				<text class="slider-label">MIN</text>
				<text class="slider-label">MAX</text>
			</view>
		</view>

		<!-- 开启/关闭按钮 -->
		<view class="plan-btn-wrap">
			<view
				class="plan-btn"
				:class="planEnabled ? 'plan-btn-off' : 'plan-btn-on'"
				@click="togglePlan"
			>
				<text class="plan-btn-icon">{{ planEnabled ? '⏸' : '▶' }}</text>
				<text class="plan-btn-text">{{ planEnabled ? '关闭发送计划' : '开启发送计划' }}</text>
			</view>
		</view>

		<!-- 底部说明 -->
		<view class="bottom-hint-wrap">
			<text class="bottom-hint">只要定期进入 App 刷新倒计时，计划将不会触发发送。系统仅在您失联且满足设定天数时才会发送通知。</text>
		</view>

		<view style="height: 24px;"></view>
	</scroll-view>
</template>

<script>
	import { store, mutations } from '../store/index.js'

	export default {
		name: 'SendView',
		data() {
			return {
				statusBarHeight: 44,
				emailInput: '',
				phoneInput: '',
				notifyExpanded: false
			}
		},
		computed: {
			planEnabled() {
				return store.sendPlan.enabled
			},
			emails: {
				get() { return store.sendPlan.emails || [] },
				set(v) { mutations.updateSendPlan({ emails: v }) }
			},
			phones: {
				get() { return store.sendPlan.phones || [] },
				set(v) { mutations.updateSendPlan({ phones: v }) }
			},
			displayName: {
				get() { return store.sendPlan.displayName || '' },
				set(v) { mutations.updateSendPlan({ displayName: v }) }
			},
			customGuide: {
				get() { return store.sendPlan.customGuide || '' },
				set(v) { mutations.updateSendPlan({ customGuide: v }) }
			},
			intervalDays() {
				return store.sendPlan.intervalDays || 7
			},
			formattedSendDate() {
				const d = store.sendPlan.sendDate ? new Date(store.sendPlan.sendDate) : null
				if (!d || !this.planEnabled) return '—'
				const year = d.getFullYear()
				const month = d.getMonth() + 1
				const day = d.getDate()
				return `${year}年${month}月${day}日`
			}
		},
		mounted() {
			uni.getSystemInfo({
				success: (info) => {
					this.statusBarHeight = info.statusBarHeight || 44
				}
			})
		},
		methods: {
			addEmail() {
				const email = this.emailInput.trim()
				if (!email || this.emails.length >= 3) return
				mutations.updateSendPlan({ emails: [...this.emails, email] })
				this.emailInput = ''
			},
			addPhone() {
				const phone = this.phoneInput.trim()
				if (!phone || this.phones.length >= 3) return
				mutations.updateSendPlan({ phones: [...this.phones, phone] })
				this.phoneInput = ''
			},
			removeEmail(i) {
				const list = [...this.emails]
				list.splice(i, 1)
				mutations.updateSendPlan({ emails: list })
			},
			removePhone(i) {
				const list = [...this.phones]
				list.splice(i, 1)
				mutations.updateSendPlan({ phones: list })
			},
			saveDisplayName() {
				mutations.updateSendPlan({ displayName: this.displayName })
			},
			saveCustomGuide() {
				mutations.updateSendPlan({ customGuide: this.customGuide })
			},
			toggleNotifyExpand() {
				this.notifyExpanded = !this.notifyExpanded
			},
			onSliderChange(e) {
				const days = e.detail.value
				mutations.updateSendPlan({ intervalDays: days })
				if (this.planEnabled) {
					const newDate = new Date()
					newDate.setDate(newDate.getDate() + days)
					mutations.updateSendPlan({ sendDate: newDate.toISOString() })
				}
			},
			onSliderChanging(e) {
				mutations.updateSendPlan({ intervalDays: e.detail.value })
			},
			togglePlan() {
				if (this.planEnabled) {
					mutations.updateSendPlan({ enabled: false })
				} else {
					const days = store.sendPlan.intervalDays || 7
					const newDate = new Date()
					newDate.setDate(newDate.getDate() + days)
					mutations.updateSendPlan({
						enabled: true,
						sendDate: newDate.toISOString()
					})
				}
			}
		}
	}
</script>

<style scoped>
	.send-page {
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
	}

	.page-title {
		font-size: 34px;
		font-weight: 700;
		color: #1C1C1E;
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

	.section-label-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
		padding: 0 20px 8px;
	}

	.section-icon {
		font-size: 14px;
	}

	.section-label {
		font-size: 13px;
		color: #6C6C70;
		font-weight: 500;
	}

	.contacts-card {
		margin: 0 16px 12px;
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}

	.input-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 12px 16px;
		gap: 10px;
	}

	.contact-input {
		flex: 1;
		font-size: 15px;
		color: #1C1C1E;
		background: transparent;
		border: none;
		outline: none;
	}

	.input-placeholder {
		color: #C7C7CC;
	}

	.add-contact-btn {
		width: 28px;
		height: 28px;
		background-color: #007AFF;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.add-contact-btn-disabled {
		background-color: #C7C7CC;
	}

	.add-contact-icon {
		font-size: 20px;
		color: #FFFFFF;
		line-height: 1;
		margin-top: -1px;
	}

	.divider {
		height: 0.5px;
		background-color: #E5E5EA;
		margin: 0 16px;
	}

	.contact-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 12px 16px;
		gap: 10px;
		background-color: #EEF4FF;
	}

	.contact-type-icon {
		font-size: 16px;
	}

	.contact-value {
		flex: 1;
		font-size: 15px;
		color: #1C1C1E;
	}

	.delete-btn {
		width: 20px;
		height: 20px;
		background-color: rgba(60, 60, 67, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.delete-icon {
		font-size: 10px;
		color: #FFFFFF;
	}

	.info-card {
		margin: 0 16px 12px;
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}

	.info-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 14px 16px;
		gap: 10px;
	}

	.info-icon {
		font-size: 16px;
	}

	.info-label {
		font-size: 16px;
		color: #1C1C1E;
		min-width: 70px;
	}

	.info-value-input {
		flex: 1;
		font-size: 15px;
		color: #007AFF;
		text-align: right;
		background: transparent;
		border: none;
		outline: none;
	}

	.notify-card {
		margin: 0 16px 12px;
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}

	.notify-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 14px 16px;
		gap: 10px;
	}

	.notify-title {
		font-size: 16px;
		color: #1C1C1E;
		flex: 1;
	}

	.notify-preview-link {
		font-size: 13px;
		color: #8E8E93;
	}

	.notify-chevron {
		font-size: 14px;
		color: #8E8E93;
		margin-left: 4px;
	}

	.notify-content {
		padding-bottom: 14px;
	}

	.notify-text-area {
		padding: 14px 16px 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.notify-line {
		font-size: 14px;
		color: #3C3C43;
		line-height: 1.5;
	}

	.notify-name {
		color: #5856D6;
		font-weight: 600;
	}

	.notify-signature {
		color: #6C6C70;
		font-style: italic;
	}

	.guide-textarea {
		width: 100%;
		min-height: 60px;
		background-color: #F2F2F7;
		border-radius: 8px;
		padding: 10px;
		font-size: 14px;
		color: #1C1C1E;
		border: none;
		outline: none;
	}

	.notify-hint {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 6px;
		margin-top: 6px;
	}

	.notify-hint-icon {
		font-size: 12px;
	}

	.notify-hint-text {
		font-size: 12px;
		color: #8E8E93;
		flex: 1;
		line-height: 1.4;
	}

	.trigger-card {
		margin: 0 16px 12px;
		background: #FFFFFF;
		border-radius: 12px;
		padding: 16px;
	}

	.trigger-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 12px;
		gap: 8px;
	}

	.trigger-title {
		font-size: 16px;
		color: #1C1C1E;
		font-weight: 500;
		flex: 1;
	}

	.trigger-date-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 4px;
	}

	.trigger-date-icon {
		font-size: 12px;
	}

	.trigger-date-text {
		font-size: 13px;
		color: #8E8E93;
	}

	.trigger-days {
		font-size: 20px;
		font-weight: 700;
		color: #007AFF;
	}

	.trigger-slider {
		width: 100%;
		margin-bottom: 4px;
	}

	.slider-labels {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.slider-label {
		font-size: 11px;
		color: #8E8E93;
	}

	.plan-btn-wrap {
		padding: 4px 16px 12px;
	}

	.plan-btn {
		width: 100%;
		height: 52px;
		border-radius: 14px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.plan-btn-on {
		background-color: #007AFF;
	}

	.plan-btn-off {
		background-color: #FF3B30;
	}

	.plan-btn-icon {
		font-size: 16px;
		color: #FFFFFF;
	}

	.plan-btn-text {
		font-size: 17px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.bottom-hint-wrap {
		padding: 0 20px 8px;
	}

	.bottom-hint {
		font-size: 12px;
		color: #8E8E93;
		line-height: 1.5;
		text-align: center;
	}
</style>
