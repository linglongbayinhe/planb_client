<template>
	<view class="sheet-overlay" @click.self="onCancel">
		<view class="sheet-container" @click.stop>
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
						@click="onTypeChange(t.key)"
					>
						<text class="type-chip-text" :class="{ 'type-chip-text-active': selectedType === t.key }">{{ t.label }}</text>
					</view>
				</view>
				<text v-if="validationError" class="validation-error">{{ validationError }}</text>

				<!-- 表单区域：类型切换时先隐藏再渐显，避免 placeholder 首帧竖排闪烁 -->
				<view
					class="form-body"
					:class="{
						'form-body-visible': formContentVisible,
						'form-body-animate': formBodyAnimate
					}"
				>
				<!-- 重要物品表单 -->
				<view v-show="selectedType === 'important'" class="form-card card form-panel-h">
					<view class="form-row">
						<text class="form-label required-label">名称</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.name" placeholder="输入名称..." placeholder-class="form-placeholder-h" @input="validationError = ''" />
						</view>
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">存放</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.location" placeholder="输入存放..." placeholder-class="form-placeholder-h" />
						</view>
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">关联</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.relation" placeholder="输入关联..." placeholder-class="form-placeholder-h" />
						</view>
					</view>
				</view>

				<view v-show="selectedType === 'important'" class="form-card card note-card form-panel-h">
					<text class="form-label-top">备注与引导</text>
					<view class="form-textarea-wrap">
						<textarea
							class="form-textarea"
							style="writing-mode: horizontal-tb;"
							v-model="form.note"
							placeholder="补充具体步骤..."
							placeholder-style="writing-mode:horizontal-tb;color:#C7C7CC;font-size:15px;line-height:1.5;"
							:auto-height="true"
							:show-confirm-bar="false"
						/>
					</view>
				</view>

				<!-- 数字资产表单 -->
				<view v-show="selectedType === 'digital'" class="form-card card form-panel-h">
					<view class="form-row">
						<text class="form-label required-label">平台</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.platform" placeholder="输入平台名称..." placeholder-class="form-placeholder-h" @input="validationError = ''" />
						</view>
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">账号</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.account" placeholder="输入账号..." placeholder-class="form-placeholder-h" />
						</view>
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">关联</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.relation" placeholder="输入关联..." placeholder-class="form-placeholder-h" />
						</view>
					</view>
				</view>

				<view v-show="selectedType === 'digital'" class="form-card card note-card form-panel-h">
					<text class="form-label-top">备注与引导</text>
					<view class="form-textarea-wrap">
						<textarea
							class="form-textarea"
							style="writing-mode: horizontal-tb;"
							v-model="form.note"
							placeholder="补充具体步骤..."
							placeholder-style="writing-mode:horizontal-tb;color:#C7C7CC;font-size:15px;line-height:1.5;"
							:auto-height="true"
							:show-confirm-bar="false"
						/>
					</view>
				</view>

				<!-- 给家人的话表单 -->
				<view v-show="selectedType === 'family'" class="form-card card form-panel-h">
					<view class="form-row">
						<text class="form-label required-label">标题</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.title" placeholder="输入标题..." placeholder-class="form-placeholder-h" @input="validationError = ''" />
						</view>
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">对象</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.target" placeholder="写给谁..." placeholder-class="form-placeholder-h" />
						</view>
					</view>
					<view class="form-divider"></view>
					<view class="form-row">
						<text class="form-label">背景</text>
						<view class="form-input-wrap">
							<input class="form-input" v-model="form.background" placeholder="背景说明..." placeholder-class="form-placeholder-h" />
						</view>
					</view>
				</view>

				<view v-show="selectedType === 'family'" class="form-card card note-card form-panel-h">
					<text class="form-label-top">正文</text>
					<view class="form-textarea-wrap">
						<textarea
							class="form-textarea"
							style="writing-mode: horizontal-tb;"
							v-model="form.note"
							placeholder="写下想说的话..."
							placeholder-style="writing-mode:horizontal-tb;color:#C7C7CC;font-size:15px;line-height:1.5;"
							:auto-height="true"
							:show-confirm-bar="false"
						/>
					</view>
				</view>

				<view style="height: 40px;"></view>
				</view>
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
				validationError: '',
				formContentVisible: true,
				formBodyAnimate: false,
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
			onTypeChange(key) {
				if (key === this.selectedType) return
				this.validationError = ''
				this.formContentVisible = false
				this.formBodyAnimate = false
				this.selectedType = key
				this.resetForm()
				this.$nextTick(() => {
					setTimeout(() => {
						this.formContentVisible = true
						this.formBodyAnimate = true
					}, 40)
				})
			},
			resetForm() {
				this.form = {
					name: '', location: '', relation: '', note: '',
					platform: '', account: '',
					title: '', target: '', background: ''
				}
			},
			onSave() {
				if (!this.canSave) {
					if (this.selectedType === 'important') this.validationError = '请填写名称'
					else if (this.selectedType === 'digital') this.validationError = '请填写平台'
					else if (this.selectedType === 'family') this.validationError = '请填写标题'
					return
				}
				this.validationError = ''
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
				const saved = mutations.addClue(clue)
				if (!saved) return
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

	.validation-error {
		display: block;
		font-size: 13px;
		color: #FF3B30;
		padding: 4px 16px 12px;
	}

	.form-body {
		opacity: 0;
	}
	.form-body.form-body-visible {
		opacity: 1;
	}
	.form-body.form-body-animate {
		transition: opacity 0.18s ease-out;
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

	.form-panel-h {
		direction: ltr;
		writing-mode: horizontal-tb;
	}

	.form-input-wrap {
		flex: 1;
		direction: ltr;
		writing-mode: horizontal-tb;
		min-width: 0;
	}

	.form-textarea-wrap {
		width: 100%;
		direction: ltr;
		writing-mode: horizontal-tb;
	}

	.form-input {
		width: 100%;
		font-size: 15px;
		color: #1C1C1E;
		background: transparent;
		border: none;
		outline: none;
		direction: ltr;
		writing-mode: horizontal-tb;
	}

	.form-placeholder {
		color: #C7C7CC;
		direction: ltr;
		writing-mode: horizontal-tb;
	}

	.form-placeholder-h {
		color: #C7C7CC !important;
		direction: ltr !important;
		writing-mode: horizontal-tb !important;
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
		direction: ltr;
		writing-mode: horizontal-tb;
	}
</style>
