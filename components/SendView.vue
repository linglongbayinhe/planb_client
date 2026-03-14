<template>
	<scroll-view
		class="send-page"
		scroll-y
		:style="{ paddingTop: (statusBarHeight || 0) + 'px' }"
	>
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
			<!-- 添加邮箱行：满 3 个时整行隐藏 -->
			<view v-if="emails.length < maxEmails" class="input-row">
				<input
					class="contact-input"
					v-model="emailInput"
					placeholder="添加邮箱"
					placeholder-class="input-placeholder"
					type="text"
					:maxlength="100"
				/>
				<view
					class="add-contact-btn"
					:class="{ 'add-contact-btn-disabled': !emailInput.trim() }"
					@click="addEmail"
				>
					<text class="add-contact-icon">+</text>
				</view>
			</view>

			<view v-if="emails.length < maxEmails" class="divider"></view>

			<!-- 添加手机号行：满 3 个时整行隐藏 -->
			<view v-if="phones.length < maxPhones" class="input-row">
				<input
					class="contact-input"
					v-model="phoneInput"
					placeholder="添加手机号"
					placeholder-class="input-placeholder"
					type="number"
					:maxlength="11"
				/>
				<view
					class="add-contact-btn"
					:class="{ 'add-contact-btn-disabled': !phoneInput.trim() }"
					@click="addPhone"
				>
					<text class="add-contact-icon">+</text>
				</view>
			</view>

			<view v-if="phones.length < maxPhones || emails.length > 0" class="divider"></view>

			<!-- 已添加的邮箱列表 -->
			<view v-for="(email, i) in emails" :key="'e'+i">
				<view class="divider"></view>
				<view class="contact-item">
					<text class="contact-type-icon">✉️</text>
					<text class="contact-label">邮箱（{{ i + 1 }}/{{ maxEmails }}）</text>
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
					<text class="contact-label">手机号（{{ i + 1 }}/{{ maxPhones }}）</text>
					<text class="contact-value">{{ phone }}</text>
					<view class="delete-btn" @click="removePhone(i)">
						<text class="delete-icon">✕</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 展示姓名 + 通知正文（合并卡片） -->
		<view class="content-card card">
			<view class="info-row">
				<text class="info-icon">🔗</text>
				<text class="info-label">展示姓名</text>
				<input
					class="info-value-input"
					v-model="displayNameLocal"
					placeholder="未设置"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view class="divider"></view>
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
						如果你收到了这条通知，<text class="notify-name">{{ displayNameLocal || '（未设置）' }}</text> 可能暂时无法亲自与你联系。
					</text>
					<text class="notify-line">
						<text class="notify-name">{{ displayNameLocal || '（未设置）' }}</text> 在 Plan B（后手）App 中预留了一份「人生备份计划」。
					</text>
					<text class="notify-line">查找线索：请从</text>
					<textarea
						class="guide-textarea"
						v-model="customGuideLocal"
						placeholder="填写查找线索的起始指引..."
						placeholder-class="input-placeholder"
						:auto-height="true"
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

			<view v-if="contentDirty" class="content-dirty-bar">
				<text class="content-dirty-hint">*内容已变更，请点击「应用」按钮进行变更。</text>
				<view class="apply-btn" @click="applyContent">
					<text class="apply-btn-text">应用</text>
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
			<view class="trigger-slider-wrap">
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
		</view>

		<!-- 开启/关闭按钮 -->
		<view class="plan-btn-wrap">
			<view
				class="plan-btn"
				:class="planEnabled ? 'plan-btn-off' : 'plan-btn-on'"
				@click="togglePlan"
			>
				<image
					class="plan-btn-icon-img"
					:src="planEnabled ? '/static/icons/pause.png' : '/static/icons/play.png'"
					mode="aspectFit"
				/>
				<text class="plan-btn-text">{{ planEnabled ? '关闭发送计划' : '开启发送计划' }}</text>
			</view>
		</view>

		<!-- 临时：30 秒后触发（测试用） -->
		<view class="plan-btn-wrap">
			<view class="plan-btn plan-btn-test" @click="trigger30Sec">
				<text class="plan-btn-text">30 秒后触发</text>
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
				notifyExpanded: false,
				maxEmails: 3,
				maxPhones: 3,
				displayNameLocal: '',
				customGuideLocal: '',
				appliedDisplayName: '',
				appliedCustomGuide: ''
			}
		},
		computed: {
			currentUid() {
				const u = store.currentUser
				return (u && (u._id || u.uid)) || ''
			},
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
			contentDirty() {
				return this.displayNameLocal !== this.appliedDisplayName ||
					this.customGuideLocal !== this.appliedCustomGuide
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
			try {
				const info = (typeof uni.getWindowInfo === 'function') ? uni.getWindowInfo() : null
				this.statusBarHeight = (info && info.statusBarHeight) ?? 44
			} catch (e) {
				this.statusBarHeight = 44
			}
			this.syncContentFromStore()
		},
		methods: {
			addEmail() {
				if (!this.currentUid) {
					uni.showToast({ title: '请先登录', icon: 'none' })
					return
				}
				const email = this.emailInput.trim().toLowerCase()
				if (!email) return
				const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
				if (!emailReg.test(email)) {
					uni.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
					return
				}
				if (this.emails.length >= this.maxEmails) return
				if (this.emails.map(e => e.toLowerCase()).includes(email)) {
					uni.showToast({ title: '该邮箱已存在', icon: 'none' })
					return
				}
				mutations.updateSendPlan({ emails: [...this.emails, this.emailInput.trim()] })
				this.emailInput = ''
				this.syncSendEmailToCloud(email, true)
			},
			addPhone() {
				if (!this.currentUid) {
					uni.showToast({ title: '请先登录', icon: 'none' })
					return
				}
				const phone = this.phoneInput.trim()
				if (!phone) return
				const phoneReg = /^1[3-9]\d{9}$/
				if (!phoneReg.test(phone)) {
					uni.showToast({ title: '请输入有效的手机号', icon: 'none' })
					return
				}
				if (this.phones.length >= this.maxPhones) return
				if (this.phones.includes(phone)) {
					uni.showToast({ title: '该手机号已存在', icon: 'none' })
					return
				}
				mutations.updateSendPlan({ phones: [...this.phones, phone] })
				this.phoneInput = ''
				this.syncSendPhoneToCloud(phone, true)
			},
			removeEmail(i) {
				if (!this.currentUid) {
					uni.showToast({ title: '请先登录', icon: 'none' })
					return
				}
				const removedEmail = this.emails[i]
				const list = [...this.emails]
				list.splice(i, 1)
				mutations.updateSendPlan({ emails: list })
				if (removedEmail) this.syncSendEmailToCloud(removedEmail, false)
			},
			removePhone(i) {
				if (!this.currentUid) {
					uni.showToast({ title: '请先登录', icon: 'none' })
					return
				}
				const removedPhone = this.phones[i]
				const list = [...this.phones]
				list.splice(i, 1)
				mutations.updateSendPlan({ phones: list })
				if (removedPhone) this.syncSendPhoneToCloud(removedPhone, false)
			},
			async syncSendEmailToCloud(email, isNew) {
				const uid = store.currentUser && (store.currentUser._id || store.currentUser.uid)
				if (!uid) return
				try {
					const obj = uniCloud.importObject('send_email')
					const res = await obj.updateSendEmail(email, isNew, uid)
					if (res && res.errCode && res.errCode !== 'UID_REQUIRED') {
						uni.showToast({ title: res.errMsg || '云端同步失败', icon: 'none', duration: 2000 })
					}
				} catch (e) {
					uni.showToast({ title: (e && e.message) || '云端同步失败', icon: 'none', duration: 2000 })
				}
			},
			async syncSendPhoneToCloud(phone, isNew) {
				const uid = store.currentUser && (store.currentUser._id || store.currentUser.uid)
				if (!uid) return
				try {
					const obj = uniCloud.importObject('send_phone')
					const res = await obj.updateSendPhone(phone, isNew, uid)
					if (res && res.errCode && res.errCode !== 'UID_REQUIRED') {
						uni.showToast({ title: res.errMsg || '云端同步失败', icon: 'none', duration: 2000 })
					}
				} catch (e) {
					uni.showToast({ title: (e && e.message) || '云端同步失败', icon: 'none', duration: 2000 })
				}
			},
			syncContentFromStore() {
				const d = store.sendPlan.displayName || ''
				const c = store.sendPlan.customGuide || ''
				this.displayNameLocal = d
				this.customGuideLocal = c
				this.appliedDisplayName = d
				this.appliedCustomGuide = c
			},
			async applyContent() {
				mutations.updateSendPlan({
					displayName: this.displayNameLocal,
					customGuide: this.customGuideLocal
				})
				this.appliedDisplayName = this.displayNameLocal
				this.appliedCustomGuide = this.customGuideLocal
				await this.syncSendMessageToCloud()
			},
			async syncSendMessageToCloud() {
				const uid = store.currentUser && (store.currentUser._id || store.currentUser.uid)
				if (!uid) return
				try {
					const obj = uniCloud.importObject('send_message')
					const res = await obj.updateSendMessage(
						this.displayNameLocal,
						this.customGuideLocal,
						uid
					)
					if (res && res.errCode && res.errCode !== 'UID_REQUIRED') {
						uni.showToast({ title: res.errMsg || '云端同步失败', icon: 'none', duration: 2000 })
					}
				} catch (e) {
					uni.showToast({ title: (e && e.message) || '云端同步失败', icon: 'none', duration: 2000 })
				}
			},
			toggleNotifyExpand() {
				this.notifyExpanded = !this.notifyExpanded
			},
			onSliderChange(e) {
				const days = e.detail.value
				mutations.updateSendPlan({ intervalDays: days })
			},
			onSliderChanging(e) {
				mutations.updateSendPlan({ intervalDays: e.detail.value })
			},
			async togglePlan() {
				const newEnabled = !this.planEnabled
				if (this.planEnabled) {
					mutations.updateSendPlan({ enabled: false })
				} else {
					mutations.updateSendPlan({ enabled: true })
				}
				let uid = store.currentUser && (store.currentUser.uid || store.currentUser._id)
				if (!uid && typeof uniCloud !== 'undefined' && typeof uniCloud.getCurrentUserInfo === 'function') {
					try {
						const u = await uniCloud.getCurrentUserInfo()
						uid = u && (u.uid || u._id)
					} catch (e) {}
				}
				try {
					const obj = uniCloud.importObject('set_enable_sending')
					const res = await obj.setEnableSending(newEnabled, uid || undefined)
					if (res && res.errCode) {
						const msg = res.errCode === 'UID_REQUIRED'
							? '请先登录以同步到云端'
							: (res.errMsg || '同步失败')
						uni.showToast({ title: msg, icon: 'none' })
					}
				} catch (e) {
					uni.showToast({ title: (e && e.message) || '同步到云端失败', icon: 'none' })
				}
			},
			async trigger30Sec() {
				if (!this.currentUid) {
					uni.showToast({ title: '请先登录', icon: 'none' })
					return
				}
				try {
					const obj = uniCloud.importObject('send_time')
					const res = await obj.updateSendTime(Date.now() + 30000, this.currentUid)
					if (res && res.errCode) {
						uni.showToast({ title: res.errMsg || '设置失败', icon: 'none' })
						return
					}
					uni.showToast({ title: '已设置 30 秒后触发', icon: 'success' })
				} catch (e) {
					uni.showToast({ title: (e && e.message) || '设置失败', icon: 'none' })
				}
			}
		}
	}
</script>

<style scoped>
	.send-page {
		width: 100%;
		height: 100%;
		background-color: #F5F5F5;
		box-sizing: border-box;
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
		min-width: 0;
	}

	.contact-type-icon {
		font-size: 16px;
		flex-shrink: 0;
	}

	.contact-label {
		font-size: 12px;
		color: #8E8E93;
		margin-right: 6px;
		flex-shrink: 0;
	}

	.contact-value {
		flex: 1;
		min-width: 0;
		font-size: 15px;
		color: #1C1C1E;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.delete-btn {
		width: 40rpx;
		min-width: 40rpx;
		height: 40rpx;
		flex-shrink: 0;
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

	.content-card {
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
		padding: 16rpx 30rpx;
		font-size: 14px;
		color: #1C1C1E;
		border: none;
		outline: none;
		box-sizing: border-box;
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

	.content-dirty-bar {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 16px 14px;
		background-color: #FFF9E6;
		border-top: 0.5px solid #E5E5EA;
	}

	.content-dirty-hint {
		flex: 1;
		font-size: 13px;
		color: #8E8E93;
		line-height: 1.4;
	}

	.apply-btn {
		flex-shrink: 0;
		padding: 8px 20px;
		background-color: #007AFF;
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.apply-btn-text {
		font-size: 15px;
		font-weight: 600;
		color: #FFFFFF;
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
		justify-content: flex-start;
		gap: 4px;
		min-width: 200px;
	}

	.trigger-date-icon {
		font-size: 12px;
		flex-shrink: 0;
	}

	.trigger-date-text {
		font-size: 13px;
		color: #8E8E93;
		text-align: left;
		flex: 1;
		min-width: 0;
	}

	.trigger-days {
		font-size: 20px;
		font-weight: 700;
		color: #007AFF;
	}

	.trigger-slider-wrap {
		padding: 0 16px;
		box-sizing: border-box;
	}

	.trigger-slider {
		width: 100%;
		margin: 0 0 4px 0;
		box-sizing: border-box;
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
		background-color:  #FF3B30;
	}

	.plan-btn-icon-img {
		width: 40rpx;
		height: 40rpx;
		margin-right: 10rpx;
		flex-shrink: 0;
	}

	.plan-btn-off .plan-btn-icon-img {
		filter: brightness(0) invert(1);
	}

	.plan-btn-off .plan-btn-text {
		color: #FFFFFF;
	}

	.plan-btn-test {
		background-color: #8E8E93;
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
