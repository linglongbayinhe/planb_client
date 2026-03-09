<template>
	<view class="sheet-overlay" @click.self="onCancel">
		<view class="sheet-container">
			<view class="drag-handle"></view>

			<!-- 导航栏 -->
			<view class="sheet-nav">
				<view class="nav-btn" @click="onCancel">
					<text class="nav-cancel">取消</text>
				</view>
				<text class="sheet-title">编辑</text>
				<view class="nav-btn" :class="{ 'nav-btn-disabled': !canSave }" @click="onSave">
					<text class="nav-done" :class="{ 'done-disabled': !canSave }">完成</text>
				</view>
			</view>

			<scroll-view class="sheet-scroll" scroll-y>
				<!-- 类型标签（不可改） -->
				<view class="type-display">
					<view class="type-badge" :style="{ backgroundColor: typeColor + '22' }">
						<text class="type-badge-text" :style="{ color: typeColor }">{{ typeLabel }}</text>
					</view>
				</view>

				<!-- 重要物品表单 -->
				<view v-if="clue.type === 'important'" class="form-card card">
					<view class="form-row">
						<text class="form-label">名称</text>
						<input class="form-input" v-model="form.name" placeholder="输入名称..." placeholder-class="form-placeholder" />
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">存放</text>
						<input class="form-input" v-model="form.location" placeholder="输入存放..." placeholder-class="form-placeholder" />
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">关联</text>
						<input class="form-input" v-model="form.relation" placeholder="输入关联..." placeholder-class="form-placeholder" />
					</view>
				</view>
				<view v-if="clue.type === 'important'" class="form-card card note-card">
					<text class="form-label-top">备注与引导</text>
					<textarea class="form-textarea" v-model="form.note" placeholder="补充具体步骤..." placeholder-class="form-placeholder" :auto-height="true" />
				</view>

				<!-- 数字资产表单 -->
				<view v-if="clue.type === 'digital'" class="form-card card">
					<view class="form-row">
						<text class="form-label">平台</text>
						<input class="form-input" v-model="form.platform" placeholder="输入平台名称..." placeholder-class="form-placeholder" />
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">账号</text>
						<input class="form-input" v-model="form.account" placeholder="输入账号..." placeholder-class="form-placeholder" />
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">关联</text>
						<input class="form-input" v-model="form.relation" placeholder="输入关联..." placeholder-class="form-placeholder" />
					</view>
				</view>
				<view v-if="clue.type === 'digital'" class="form-card card note-card">
					<text class="form-label-top">备注与引导</text>
					<textarea class="form-textarea" v-model="form.note" placeholder="补充具体步骤..." placeholder-class="form-placeholder" :auto-height="true" />
				</view>

				<!-- 给家人的话表单 -->
				<view v-if="clue.type === 'family'" class="form-card card">
					<view class="form-row">
						<text class="form-label">标题</text>
						<input class="form-input" v-model="form.title" placeholder="输入标题..." placeholder-class="form-placeholder" />
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">对象</text>
						<input class="form-input" v-model="form.target" placeholder="写给谁..." placeholder-class="form-placeholder" />
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">背景</text>
						<input class="form-input" v-model="form.background" placeholder="背景说明..." placeholder-class="form-placeholder" />
					</view>
				</view>
				<view v-if="clue.type === 'family'" class="form-card card note-card">
					<text class="form-label-top">正文</text>
					<textarea class="form-textarea" v-model="form.note" placeholder="写下想说的话..." placeholder-class="form-placeholder" :auto-height="true" />
				</view>

				<view style="height: 40px;"></view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import { mutations } from '../../store/index.js'

	export default {
		name: 'EditClueSheet',
		props: {
			clue: {
				type: Object,
				required: true
			}
		},
		emits: ['close', 'saved'],
		data() {
			return {
				form: {
					name: this.clue.name || '',
					location: this.clue.location || '',
					relation: this.clue.relation || '',
					note: this.clue.note || '',
					platform: this.clue.platform || '',
					account: this.clue.account || '',
					title: this.clue.title || '',
					target: this.clue.target || '',
					background: this.clue.background || ''
				}
			}
		},
		computed: {
			typeLabel() {
				const map = { important: '重要物品', digital: '数字资产', family: '给家人的话' }
				return map[this.clue.type] || '未知'
			},
			typeColor() {
				const map = { important: '#FF9500', digital: '#007AFF', family: '#34C759' }
				return map[this.clue.type] || '#8E8E93'
			},
			canSave() {
				if (this.clue.type === 'important') return !!this.form.name.trim()
				if (this.clue.type === 'digital') return !!this.form.platform.trim()
				if (this.clue.type === 'family') return !!this.form.title.trim()
				return false
			}
		},
		methods: {
			onCancel() {
				this.$emit('close')
			},
			onSave() {
				if (!this.canSave) return
				const updates = { ...this.form }
				mutations.updateClue(this.clue.id, updates)
				const updated = { ...this.clue, ...updates, updatedAt: new Date().toISOString() }
				this.$emit('saved', updated)
			}
		}
	}
</script>

<style scoped>
	.sheet-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 1100;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.sheet-container {
		background-color: #F2F2F7;
		border-radius: 16px 16px 0 0;
		max-height: 90vh;
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

	.nav-btn { min-width: 44px; }
	.nav-btn-disabled { opacity: 0.4; }

	.nav-cancel {
		font-size: 17px;
		color: #8E8E93;
		background-color: #E5E5EA;
		padding: 6px 14px;
		border-radius: 20px;
	}

	.nav-done {
		font-size: 17px;
		color: #007AFF;
		font-weight: 600;
	}

	.done-disabled { color: #8E8E93; }

	.sheet-scroll { flex: 1; }

	.type-display {
		padding: 4px 16px 12px;
	}

	.type-badge {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 5px 12px;
		border-radius: 20px;
		align-self: flex-start;
	}

	.type-badge-text {
		font-size: 14px;
		font-weight: 600;
	}

	.form-card {
		margin: 0 16px 12px;
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}

	.note-card { padding: 14px 16px; }

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
		min-width: 36px;
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

	.form-label-top {
		font-size: 15px;
		font-weight: 500;
		color: #1C1C1E;
		margin-bottom: 10px;
	}

	.form-textarea {
		width: 100%;
		min-height: 80px;
		font-size: 15px;
		color: #1C1C1E;
		background: transparent;
		border: none;
		outline: none;
		line-height: 1.5;
	}
</style>
