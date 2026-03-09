<template>
	<view class="sheet-overlay" @click.self="onClose">
		<view class="sheet-container">
			<view class="drag-handle"></view>

			<!-- 导航栏 -->
			<view class="sheet-nav">
				<view class="nav-btn" @click="onClose">
					<text class="nav-cancel">取消</text>
				</view>
				<text class="sheet-title">导出线索手册</text>
				<view style="min-width: 44px;"></view>
			</view>

			<scroll-view class="sheet-scroll" scroll-y>
				<!-- 文件名 -->
				<text class="form-section-title">文件名</text>
				<view class="filename-card card">
					<text class="filename-icon">📄</text>
					<input
						class="filename-input"
						v-model="fileName"
						placeholder="线索手册"
						placeholder-class="form-placeholder"
					/>
					<text class="filename-ext">.pdf</text>
				</view>

				<!-- 预览信息 -->
				<view class="preview-card card">
					<view class="preview-icon-wrap">
						<text class="preview-icon">📋</text>
					</view>
					<text class="preview-title">{{ fileName || '线索手册' }}</text>

					<view class="preview-stats">
						<view class="preview-stat-row">
							<text class="preview-stat-label">总线索数</text>
							<text class="preview-stat-value">{{ totalClues }} 条</text>
						</view>
						<view v-for="(count, type) in typeStats" :key="type">
							<view class="preview-stat-row" v-if="count > 0">
								<text class="preview-stat-label">{{ typeLabels[type] }}</text>
								<text class="preview-stat-value" :class="{ 'stat-highlight': count > 0 }">{{ count }} 条</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 密码设置 -->
				<view class="password-card card">
					<view class="password-row">
						<text class="password-icon">🔒</text>
						<view class="password-info">
							<text class="password-title">设置 PDF 密码</text>
							<text class="password-desc">打开文件时需要输入密码</text>
						</view>
						<switch
							:checked="usePassword"
							color="#007AFF"
							@change="usePassword = $event.detail.value"
						/>
					</view>

					<template v-if="usePassword">
						<view class="password-divider"></view>
						<view class="password-input-row">
							<text class="password-field-label">密码</text>
							<input
								class="password-input"
								v-model="password"
								type="password"
								placeholder="输入密码..."
								placeholder-class="form-placeholder"
							/>
						</view>
						<view class="password-divider"></view>
						<view class="password-input-row">
							<text class="password-field-label">确认密码</text>
							<input
								class="password-input"
								v-model="confirmPassword"
								type="password"
								placeholder="再次输入..."
								placeholder-class="form-placeholder"
							/>
						</view>
						<view class="password-divider"></view>
						<view class="password-input-row">
							<text class="password-field-label">密码提示</text>
							<input
								class="password-input"
								v-model="passwordHint"
								placeholder="可选..."
								placeholder-class="form-placeholder"
							/>
						</view>
					</template>
				</view>

				<!-- 导出按钮 -->
				<view class="export-btn-wrap">
					<view
						class="export-btn"
						:class="{ 'export-btn-disabled': !canExport }"
						@click="doExport"
					>
						<text class="export-btn-icon">↑</text>
						<text class="export-btn-text">导出 PDF</text>
					</view>
				</view>

				<!-- 说明文字 -->
				<view class="hints-area">
					<view class="hint-row">
						<text class="hint-icon">🛡</text>
						<text class="hint-text">PDF 文件在本地生成，不会上传到任何服务器</text>
					</view>
					<view class="hint-row">
						<text class="hint-icon">📤</text>
						<text class="hint-text">导出后可通过 AirDrop、邮件等方式分享</text>
					</view>
					<view class="hint-row">
						<text class="hint-icon">🔒</text>
						<text class="hint-text">设置密码后，打开 PDF 需要输入密码</text>
					</view>
				</view>

				<view style="height: 40px;"></view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import { store } from '../../store/index.js'

	export default {
		name: 'ExportPDFSheet',
		emits: ['close'],
		data() {
			return {
				fileName: '线索手册',
				usePassword: false,
				password: '',
				confirmPassword: '',
				passwordHint: '',
				typeLabels: {
					important: '重要物品',
					digital: '数字资产',
					family: '给家人的话'
				}
			}
		},
		computed: {
			totalClues() {
				return store.clues.length
			},
			typeStats() {
				const stats = { important: 0, digital: 0, family: 0 }
				store.clues.forEach(c => {
					if (stats[c.type] !== undefined) stats[c.type]++
				})
				return stats
			},
			canExport() {
				if (this.totalClues === 0) return false
				if (this.usePassword) {
					return this.password.length > 0 && this.password === this.confirmPassword
				}
				return true
			}
		},
		methods: {
			onClose() {
				this.$emit('close')
			},
			doExport() {
				if (!this.canExport) return
				uni.showToast({
					title: '导出功能即将上线',
					icon: 'none',
					duration: 2000
				})
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
		max-height: 90vh;
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

	.nav-btn { min-width: 44px; }

	.nav-cancel {
		font-size: 17px;
		color: #8E8E93;
		background-color: #E5E5EA;
		padding: 6px 14px;
		border-radius: 20px;
	}

	.sheet-scroll { flex: 1; }

	.form-section-title {
		font-size: 13px;
		color: #6C6C70;
		padding: 4px 20px 8px;
		font-weight: 500;
	}

	.filename-card {
		margin: 0 16px 16px;
		background: #FFFFFF;
		border-radius: 12px;
		padding: 14px 16px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
	}

	.filename-icon { font-size: 18px; }

	.filename-input {
		flex: 1;
		font-size: 15px;
		color: #1C1C1E;
		background: transparent;
		border: none;
		outline: none;
	}

	.filename-ext {
		font-size: 15px;
		color: #8E8E93;
	}

	.form-placeholder { color: #C7C7CC; }

	.preview-card {
		margin: 0 16px 16px;
		background: #FFFFFF;
		border-radius: 12px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.preview-icon-wrap {
		width: 56px; height: 56px;
		background-color: #EEF4FF;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 4px;
	}

	.preview-icon { font-size: 30px; }

	.preview-title {
		font-size: 18px;
		font-weight: 700;
		color: #1C1C1E;
		margin-bottom: 8px;
	}

	.preview-stats {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 6px;
		border-top: 0.5px solid #E5E5EA;
		padding-top: 12px;
	}

	.preview-stat-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.preview-stat-label {
		font-size: 14px;
		color: #8E8E93;
	}

	.preview-stat-value {
		font-size: 14px;
		color: #1C1C1E;
	}

	.stat-highlight { color: #FF9500; }

	.password-card {
		margin: 0 16px 16px;
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}

	.password-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 14px 16px;
		gap: 12px;
	}

	.password-icon { font-size: 18px; }

	.password-info { flex: 1; }

	.password-title {
		font-size: 16px;
		color: #1C1C1E;
		font-weight: 500;
	}

	.password-desc {
		font-size: 13px;
		color: #8E8E93;
		margin-top: 2px;
	}

	.password-divider {
		height: 0.5px;
		background-color: #E5E5EA;
		margin: 0 16px;
	}

	.password-input-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 12px 16px;
		gap: 12px;
	}

	.password-field-label {
		font-size: 15px;
		color: #8E8E93;
		min-width: 70px;
	}

	.password-input {
		flex: 1;
		font-size: 15px;
		color: #1C1C1E;
		background: transparent;
		border: none;
		outline: none;
	}

	.export-btn-wrap {
		padding: 0 16px 16px;
	}

	.export-btn {
		width: 100%;
		height: 52px;
		background-color: #34C759;
		border-radius: 14px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.export-btn-disabled {
		opacity: 0.5;
	}

	.export-btn-icon {
		font-size: 18px;
		color: #FFFFFF;
	}

	.export-btn-text {
		font-size: 17px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.hints-area {
		padding: 0 16px;
		background-color: #EEF4FF;
		border-radius: 12px;
		margin: 0 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 14px 16px;
	}

	.hint-row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 8px;
	}

	.hint-icon { font-size: 14px; }

	.hint-text {
		font-size: 13px;
		color: #3A6EA5;
		flex: 1;
		line-height: 1.4;
	}
</style>
