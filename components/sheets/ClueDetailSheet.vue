<template>
	<view class="sheet-overlay" @tap.self="onClose">
		<view class="sheet-container" @tap.stop>
			<view class="drag-handle"></view>

			<!-- 导航栏 -->
			<view class="sheet-nav">
				<view class="nav-btn" @click="openEditSheet">
					<text class="nav-btn-edit">编辑</text>
				</view>
				<text class="sheet-title">线索详情</text>
				<view class="nav-btn" @click="onClose">
					<text class="nav-btn-done">完成</text>
				</view>
			</view>

			<scroll-view class="detail-scroll" scroll-y>
				<!-- 类型标签 + 标题 -->
				<view class="detail-header">
					<view class="type-badge" :style="{ backgroundColor: typeColor + '22' }">
						<text class="type-badge-emoji">{{ typeEmoji }}</text>
						<text class="type-badge-text" :style="{ color: typeColor }">{{ typeLabel }}</text>
					</view>
					<text class="detail-main-title">{{ mainTitle }}</text>
				</view>

				<!-- 字段卡片 -->
				<view class="fields-card card">
					<template v-if="clue.type === 'important'">
						<view class="field-row" v-if="clue.location">
							<text class="field-label">存放位置</text>
							<text class="field-value">{{ clue.location }}</text>
						</view>
						<view class="field-divider" v-if="clue.location && clue.relation"></view>
						<view class="field-row" v-if="clue.relation">
							<text class="field-label">关联</text>
							<text class="field-value">{{ clue.relation }}</text>
						</view>
						<view class="field-divider" v-if="(clue.location || clue.relation) && clue.note"></view>
						<view class="field-row field-row-multiline" v-if="clue.note">
							<text class="field-label">备注与{{ '\n' }}引导</text>
							<text class="field-value">{{ clue.note }}</text>
						</view>
					</template>

					<template v-if="clue.type === 'digital'">
						<view class="field-row" v-if="clue.account">
							<text class="field-label">账号</text>
							<text class="field-value">{{ clue.account }}</text>
						</view>
						<view class="field-divider" v-if="clue.account && clue.relation"></view>
						<view class="field-row" v-if="clue.relation">
							<text class="field-label">关联</text>
							<text class="field-value">{{ clue.relation }}</text>
						</view>
						<view class="field-divider" v-if="(clue.account || clue.relation) && clue.note"></view>
						<view class="field-row field-row-multiline" v-if="clue.note">
							<text class="field-label">备注与{{ '\n' }}引导</text>
							<text class="field-value">{{ clue.note }}</text>
						</view>
					</template>

					<template v-if="clue.type === 'family'">
						<view class="field-row" v-if="clue.target">
							<text class="field-label">对象</text>
							<text class="field-value">{{ clue.target }}</text>
						</view>
						<view class="field-divider" v-if="clue.target && clue.background"></view>
						<view class="field-row" v-if="clue.background">
							<text class="field-label">背景</text>
							<text class="field-value">{{ clue.background }}</text>
						</view>
						<view class="field-divider" v-if="(clue.target || clue.background) && clue.note"></view>
						<view class="field-row field-row-multiline" v-if="clue.note">
							<text class="field-label">正文</text>
							<text class="field-value">{{ clue.note }}</text>
						</view>
					</template>
				</view>

				<!-- 更新时间 -->
				<view class="update-time-row">
					<text class="update-time-icon">🕐</text>
					<text class="update-time-text">更新于 {{ formattedUpdatedAt }}</text>
				</view>

				<!-- 删除按钮 -->
				<view class="delete-btn-wrap">
					<view class="delete-btn" @click="confirmDelete">
						<text class="delete-btn-text">删除这条线索</text>
					</view>
				</view>

				<view style="height: 32px;"></view>
			</scroll-view>
		</view>

		<!-- 编辑Sheet -->
		<EditClueSheet
			v-if="showEditSheet"
			:clue="currentClue"
			@close="showEditSheet = false"
			@saved="onEditSaved"
		/>
	</view>
</template>

<script>
	import { mutations } from '../../store/index.js'
	import EditClueSheet from './EditClueSheet.vue'

	export default {
		name: 'ClueDetailSheet',
		components: { EditClueSheet },
		props: {
			clue: {
				type: Object,
				required: true
			}
		},
		emits: ['close', 'updated', 'deleted'],
		data() {
			return {
				showEditSheet: false,
				currentClue: { ...this.clue }
			}
		},
		computed: {
			typeLabel() {
				const map = { important: '重要物品', digital: '数字资产', family: '给家人的话' }
				return map[this.currentClue.type] || '未知'
			},
			typeColor() {
				const map = { important: '#FF9500', digital: '#007AFF', family: '#34C759' }
				return map[this.currentClue.type] || '#8E8E93'
			},
			typeEmoji() {
				const map = { important: '📦', digital: '🔑', family: '💌' }
				return map[this.currentClue.type] || '📋'
			},
			mainTitle() {
				if (this.currentClue.type === 'important') return this.currentClue.name || '未命名'
				if (this.currentClue.type === 'digital') return this.currentClue.platform || '未命名'
				if (this.currentClue.type === 'family') return this.currentClue.title || '未命名'
				return '未命名'
			},
			formattedUpdatedAt() {
				if (!this.currentClue.updatedAt) return '未知'
				const d = new Date(this.currentClue.updatedAt)
				const year = d.getFullYear()
				const month = String(d.getMonth() + 1).padStart(2, '0')
				const day = String(d.getDate()).padStart(2, '0')
				const hours = d.getHours()
				const mins = String(d.getMinutes()).padStart(2, '0')
				const ampm = hours >= 12 ? 'PM' : 'AM'
				const h12 = hours % 12 || 12
				return `${year}年${month}月${day}日 ${h12}:${mins} ${ampm}`
			}
		},
		methods: {
			onClose() {
				this.$emit('close')
			},
			openEditSheet() {
				if (!mutations.ensureAuthForWriteAction()) return
				this.showEditSheet = true
			},
			onEditSaved(updated) {
				this.currentClue = { ...updated }
				this.showEditSheet = false
				this.$emit('updated', this.currentClue)
			},
			confirmDelete() {
				if (!mutations.ensureAuthForWriteAction()) return
				uni.showModal({
					title: '删除这条线索？',
					content: '此操作不可撤销',
					confirmColor: '#FF3B30',
					confirmText: '删除',
					success: (res) => {
						if (res.confirm) {
							const deleted = mutations.deleteClue(this.currentClue.id)
							if (!deleted) return
							this.$emit('deleted')
						}
					}
				})
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
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.drag-handle {
		width: 36px;
		height: 5px;
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

	.nav-btn {
		min-width: 44px;
	}

	.nav-btn-edit {
		font-size: 17px;
		color: #007AFF;
		background-color: #EEF4FF;
		padding: 6px 14px;
		border-radius: 20px;
	}

	.nav-btn-done {
		font-size: 17px;
		color: #007AFF;
		font-weight: 600;
	}

	.detail-scroll {
		flex: 1;
	}

	.detail-header {
		padding: 8px 20px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.type-badge {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border-radius: 20px;
		align-self: flex-start;
	}

	.type-badge-emoji {
		font-size: 14px;
	}

	.type-badge-text {
		font-size: 13px;
		font-weight: 600;
	}

	.detail-main-title {
		font-size: 26px;
		font-weight: 700;
		color: #1C1C1E;
	}

	.fields-card {
		margin: 0 16px 12px;
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}

	.field-row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		padding: 14px 16px;
		gap: 16px;
	}

	.field-row-multiline {
		align-items: flex-start;
	}

	.field-label {
		font-size: 15px;
		color: #8E8E93;
		min-width: 60px;
		line-height: 1.4;
	}

	.field-value {
		flex: 1;
		font-size: 15px;
		color: #1C1C1E;
		line-height: 1.5;
	}

	.field-divider {
		height: 0.5px;
		background-color: #E5E5EA;
		margin: 0 16px;
	}

	.update-time-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 16px 16px;
	}

	.update-time-icon {
		font-size: 13px;
	}

	.update-time-text {
		font-size: 13px;
		color: #8E8E93;
	}

	.delete-btn-wrap {
		padding: 0 16px;
	}

	.delete-btn {
		background: #FFFFFF;
		border-radius: 12px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.delete-btn-text {
		font-size: 17px;
		color: #FF3B30;
		font-weight: 500;
	}
</style>
