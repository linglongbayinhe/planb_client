<template>
	<view class="sheet-overlay" @click.self="onCancel">
		<view class="sheet-container">
			<!-- 拖拽指示器 -->
			<view class="drag-handle"></view>

			<!-- 导航栏 -->
			<view class="sheet-nav">
				<view class="nav-btn" @click="onCancel">
					<text class="nav-btn-text cancel">取消</text>
				</view>
				<text class="sheet-title">添加</text>
				<view class="nav-btn" :class="{ 'nav-btn-disabled': !canSave }" @click="onSave">
					<text class="nav-btn-text done" :class="{ 'done-disabled': !canSave }">完成</text>
				</view>
			</view>

			<!-- 类型选择 -->
			<scroll-view class="sheet-scroll" scroll-y>
				<text class="form-section-title">类型</text>
				<view class="type-selector">
					<view
						v-for="t in types"
						:key="t.key"
						class="type-chip"
						:class="{ 'type-chip-active': selectedType === t.key }"
						@click="selectedType = t.key"
					>
						<text class="type-chip-text" :class="{ 'type-chip-text-active': selectedType === t.key }">{{ t.label }}</text>
					</view>
				</view>

				<!-- 重要物品表单 -->
				<view v-if="selectedType === 'important'" class="form-card card">
					<view class="form-row">
						<text class="form-label required-label">名称</text>
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

				<view v-if="selectedType === 'important'" class="form-card card note-card">
					<text class="form-label-top">备注与引导</text>
					<textarea
						class="form-textarea"
						v-model="form.note"
						placeholder="补充具体步骤..."
						placeholder-class="form-placeholder"
						:auto-height="true"
						:show-confirm-bar="false"
					/>
				</view>

				<!-- 数字资产表单 -->
				<view v-if="selectedType === 'digital'" class="form-card card">
					<view class="form-row">
						<text class="form-label required-label">平台</text>
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

				<view v-if="selectedType === 'digital'" class="form-card card note-card">
					<text class="form-label-top">备注与引导</text>
					<textarea
						class="form-textarea"
						v-model="form.note"
						placeholder="补充具体步骤..."
						placeholder-class="form-placeholder"
						:auto-height="true"
						:show-confirm-bar="false"
					/>
				</view>

				<!-- 给家人的话表单 -->
				<view v-if="selectedType === 'family'" class="form-card card">
					<view class="form-row">
						<text class="form-label required-label">标题</text>
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

				<view v-if="selectedType === 'family'" class="form-card card note-card">
					<text class="form-label-top">正文</text>
					<textarea
						class="form-textarea"
						v-model="form.note"
						placeholder="写下想说的话..."
						placeholder-class="form-placeholder"
						:auto-height="true"
						:show-confirm-bar="false"
					/>
				</view>

				<view style="height: 40px;"></view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import { mutations } from '../../store/index.js'

	export default {
		name: 'AddClueSheet',
		props: {
			initialType: {
				type: String,
				default: 'important'
			}
		},
		emits: ['close', 'saved'],
		data() {
			return {
				selectedType: this.initialType || 'important',
				form: {
					name: '', location: '', relation: '', note: '',
					platform: '', account: '',
					title: '', target: '', background: ''
				},
				types: [
					{ key: 'important', label: '重要物品' },
					{ key: 'digital', label: '数字资产' },
					{ key: 'family', label: '给家人的话' }
				]
			}
		},
		computed: {
			canSave() {
				if (this.selectedType === 'important') return !!this.form.name.trim()
				if (this.selectedType === 'digital') return !!this.form.platform.trim()
				if (this.selectedType === 'family') return !!this.form.title.trim()
				return false
			}
		},
		methods: {
			onCancel() {
				this.$emit('close')
			},
			onSave() {
				if (!this.canSave) return
				const clue = { type: this.selectedType }
				if (this.selectedType === 'important') {
					Object.assign(clue, {
						name: this.form.name,
						location: this.form.location,
						relation: this.form.relation,
						note: this.form.note
					})
				} else if (this.selectedType === 'digital') {
					Object.assign(clue, {
						platform: this.form.platform,
						account: this.form.account,
						relation: this.form.relation,
						note: this.form.note
					})
				} else if (this.selectedType === 'family') {
					Object.assign(clue, {
						title: this.form.title,
						target: this.form.target,
						background: this.form.background,
						note: this.form.note
					})
				}
				mutations.addClue(clue)
				this.$emit('saved')
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

	.nav-btn {
		min-width: 44px;
	}

	.nav-btn-disabled {
		opacity: 0.4;
	}

	.nav-btn-text {
		font-size: 17px;
	}

	.nav-btn-text.cancel {
		color: #8E8E93;
		background-color: #E5E5EA;
		padding: 6px 14px;
		border-radius: 20px;
	}

	.nav-btn-text.done {
		color: #007AFF;
		font-weight: 600;
	}

	.nav-btn-text.done-disabled {
		color: #8E8E93;
	}

	.sheet-scroll {
		flex: 1;
		overflow: hidden;
	}

	.form-section-title {
		font-size: 13px;
		color: #6C6C70;
		padding: 4px 20px 8px;
		font-weight: 500;
	}

	.type-selector {
		display: flex;
		flex-direction: row;
		padding: 0 16px 16px;
		gap: 8px;
	}

	.type-chip {
		padding: 7px 16px;
		border-radius: 20px;
		background-color: #E5E5EA;
	}

	.type-chip-active {
		background-color: #007AFF;
	}

	.type-chip-text {
		font-size: 15px;
		font-weight: 500;
		color: #3C3C43;
	}

	.type-chip-text-active {
		color: #FFFFFF;
	}

	.form-card {
		margin: 0 16px 12px;
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}

	.note-card {
		padding: 14px 16px;
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
		min-width: 36px;
	}

	.required-label {
		color: #1C1C1E;
	}

	.form-input {
		flex: 1;
		font-size: 15px;
		color: #1C1C1E;
		background: transparent;
		border: none;
		outline: none;
	}

	.form-placeholder {
		color: #C7C7CC;
	}

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
