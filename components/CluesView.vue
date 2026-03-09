<template>
	<view class="clues-page">
		<!-- 顶部状态栏占位 -->
		<view class="status-bar-placeholder" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 标题栏 -->
		<view class="nav-bar">
			<text class="page-title">线索库</text>
			<view class="add-btn" @click="openAddSheet">
				<text class="add-btn-text">+</text>
			</view>
		</view>

		<!-- 搜索框 -->
		<view class="search-bar-wrap">
			<view class="search-bar">
				<text class="search-icon">🔍</text>
				<input
					class="search-input"
					v-model="searchText"
					placeholder="搜索线索"
					placeholder-class="search-placeholder"
					@input="onSearch"
				/>
				<view v-if="searchText" class="search-clear" @click="clearSearch">
					<text class="search-clear-text">✕</text>
				</view>
			</view>
		</view>

		<!-- 分段筛选 -->
		<scroll-view class="filter-scroll" scroll-x>
			<view class="filter-row">
				<view
					v-for="(cat, i) in categories"
					:key="i"
					class="filter-chip"
					:class="{ 'filter-chip-active': currentCategory === cat.key }"
					@click="currentCategory = cat.key"
				>
					<text class="filter-chip-text" :class="{ 'filter-chip-text-active': currentCategory === cat.key }">
						{{ cat.label }}
					</text>
				</view>
			</view>
		</scroll-view>

		<!-- 滚动内容 -->
		<scroll-view class="clues-scroll" scroll-y>
			<!-- 隐私提示 -->
			<view class="privacy-notice">
				<text class="privacy-icon">🔒</text>
				<text class="privacy-text">所有数据仅存储在本设备，不会上传云端</text>
			</view>

			<!-- 导出线索手册 -->
			<view class="export-card card" @click="openExportSheet">
				<view class="export-icon-wrap">
					<text class="export-icon">📄</text>
				</view>
				<view class="export-info">
					<text class="export-title">导出线索手册</text>
					<text class="export-desc">生成加密 PDF 供离线保存</text>
				</view>
				<text class="export-arrow">›</text>
			</view>

			<!-- 线索数量 -->
			<text class="clue-count">{{ filteredClues.length }} 条线索</text>

			<!-- 空状态 -->
			<view v-if="filteredClues.length === 0" class="empty-state">
				<text class="empty-icon">📋</text>
				<text class="empty-title">暂无线索</text>
				<text class="empty-desc">点击右上角添加按钮{{'\n'}}创建您的第一条线索</text>
				<view class="empty-add-btn" @click="openAddSheet">
					<text class="empty-add-text">添加</text>
				</view>
			</view>

			<!-- 线索列表 -->
			<view v-else class="clue-list">
				<view
					v-for="clue in filteredClues"
					:key="clue.id"
					class="clue-item card"
					@click="openDetailSheet(clue)"
				>
					<view class="clue-item-icon" :style="{ backgroundColor: clueIconBg(clue.type) }">
						<text class="clue-item-icon-text">{{ clueIconEmoji(clue.type) }}</text>
					</view>
					<view class="clue-item-info">
						<text class="clue-item-title">{{ clueTitle(clue) }}</text>
						<text v-if="clueSubtitle1(clue)" class="clue-item-sub">{{ clueSubtitle1(clue) }}</text>
						<text v-if="clueSubtitle2(clue)" class="clue-item-sub">{{ clueSubtitle2(clue) }}</text>
						<text v-if="clueSubtitle3(clue)" class="clue-item-sub">{{ clueSubtitle3(clue) }}</text>
					</view>
					<text class="clue-item-arrow">›</text>
				</view>
			</view>

			<view style="height: 24px;"></view>
		</scroll-view>

		<!-- 添加线索 Sheet -->
		<AddClueSheet
			v-if="showAddSheet"
			:initial-type="currentCategory !== 'all' ? currentCategory : 'important'"
			@close="showAddSheet = false"
			@saved="onClueSaved"
		/>

		<!-- 导出 Sheet -->
		<ExportPDFSheet
			v-if="showExportSheet"
			@close="showExportSheet = false"
		/>

		<!-- 线索详情 Sheet -->
		<ClueDetailSheet
			v-if="showDetailSheet && selectedClue"
			:clue="selectedClue"
			@close="showDetailSheet = false; selectedClue = null"
			@updated="onClueUpdated"
			@deleted="onClueDeleted"
		/>
	</view>
</template>

<script>
	import { store, mutations } from '../store/index.js'
	import AddClueSheet from './sheets/AddClueSheet.vue'
	import ExportPDFSheet from './sheets/ExportPDFSheet.vue'
	import ClueDetailSheet from './sheets/ClueDetailSheet.vue'

	export default {
		name: 'CluesView',
		components: {
			AddClueSheet,
			ExportPDFSheet,
			ClueDetailSheet
		},
		data() {
			return {
				statusBarHeight: 44,
				searchText: '',
				currentCategory: 'all',
				showAddSheet: false,
				showExportSheet: false,
				showDetailSheet: false,
				selectedClue: null,
				categories: [
					{ key: 'all', label: '全部' },
					{ key: 'digital', label: '数字资产' },
					{ key: 'important', label: '重要物品' },
					{ key: 'family', label: '给家人的话' }
				]
			}
		},
		computed: {
			filteredClues() {
				let list = store.clues
				if (this.currentCategory !== 'all') {
					list = list.filter(c => c.type === this.currentCategory)
				}
				if (this.searchText.trim()) {
					const q = this.searchText.trim().toLowerCase()
					list = list.filter(c => {
						const vals = Object.values(c).join(' ').toLowerCase()
						return vals.includes(q)
					})
				}
				return list
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
			onSearch() {},
			clearSearch() {
				this.searchText = ''
			},
			openAddSheet() {
				this.showAddSheet = true
			},
			openExportSheet() {
				this.showExportSheet = true
			},
			openDetailSheet(clue) {
				this.selectedClue = clue
				this.showDetailSheet = true
			},
			onClueSaved() {
				this.showAddSheet = false
			},
			onClueUpdated(updated) {
				this.selectedClue = updated
			},
			onClueDeleted() {
				this.showDetailSheet = false
				this.selectedClue = null
			},
			clueTitle(clue) {
				if (clue.type === 'important') return clue.name || '未命名'
				if (clue.type === 'digital') return clue.platform || '未命名'
				if (clue.type === 'family') return clue.title || '未命名'
				return '未命名'
			},
			clueSubtitle1(clue) {
				if (clue.type === 'important' && clue.location) return `存放：${clue.location}`
				if (clue.type === 'digital' && clue.account) return `账号：${clue.account}`
				if (clue.type === 'family' && clue.target) return `对象：${clue.target}`
				return ''
			},
			clueSubtitle2(clue) {
				if (clue.relation) return `关联：${clue.relation}`
				if (clue.type === 'family' && clue.background) return `背景：${clue.background}`
				return ''
			},
			clueSubtitle3(clue) {
				if (clue.type !== 'family' && clue.note) return `备注：${clue.note}`
				return ''
			},
			clueIconBg(type) {
				if (type === 'important') return '#FF9500'
				if (type === 'digital') return '#007AFF'
				if (type === 'family') return '#34C759'
				return '#8E8E93'
			},
			clueIconEmoji(type) {
				if (type === 'important') return '📦'
				if (type === 'digital') return '🔑'
				if (type === 'family') return '💌'
				return '📋'
			}
		}
	}
</script>

<style scoped>
	.clues-page {
		width: 100%;
		height: 100%;
		background-color: #F2F2F7;
		display: flex;
		flex-direction: column;
	}

	.status-bar-placeholder {
		width: 100%;
		background-color: #F2F2F7;
	}

	.nav-bar {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 8px 20px 12px;
	}

	.page-title {
		font-size: 34px;
		font-weight: 700;
		color: #1C1C1E;
	}

	.add-btn {
		width: 32px;
		height: 32px;
		background-color: #007AFF;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-btn-text {
		font-size: 22px;
		color: #FFFFFF;
		line-height: 1;
		margin-top: -2px;
	}

	.search-bar-wrap {
		padding: 0 16px 10px;
	}

	.search-bar {
		background-color: rgba(118, 118, 128, 0.12);
		border-radius: 10px;
		height: 36px;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0 10px;
		gap: 6px;
	}

	.search-icon {
		font-size: 14px;
	}

	.search-input {
		flex: 1;
		font-size: 15px;
		color: #1C1C1E;
		background: transparent;
		border: none;
		outline: none;
	}

	.search-placeholder {
		color: #8E8E93;
	}

	.search-clear {
		width: 18px;
		height: 18px;
		background-color: #8E8E93;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-clear-text {
		font-size: 10px;
		color: #FFFFFF;
	}

	.filter-scroll {
		white-space: nowrap;
	}

	.filter-row {
		display: flex;
		flex-direction: row;
		padding: 0 16px 12px;
		gap: 8px;
	}

	.filter-chip {
		padding: 6px 14px;
		border-radius: 20px;
		background-color: #E5E5EA;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.filter-chip-active {
		background-color: #007AFF;
	}

	.filter-chip-text {
		font-size: 14px;
		font-weight: 500;
		color: #3C3C43;
	}

	.filter-chip-text-active {
		color: #FFFFFF;
	}

	.clues-scroll {
		flex: 1;
	}

	.privacy-notice {
		margin: 0 16px 10px;
		background-color: #EEF4FF;
		border-radius: 10px;
		padding: 10px 14px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
	}

	.privacy-icon {
		font-size: 14px;
	}

	.privacy-text {
		font-size: 13px;
		color: #3A6EA5;
		flex: 1;
	}

	.export-card {
		margin: 0 16px 10px;
		padding: 14px 16px;
		background: #FFFFFF;
		border-radius: 12px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12px;
	}

	.export-icon-wrap {
		width: 40px;
		height: 40px;
		background-color: #E8F5E9;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.export-icon {
		font-size: 20px;
	}

	.export-info {
		flex: 1;
	}

	.export-title {
		font-size: 16px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.export-desc {
		font-size: 13px;
		color: #8E8E93;
		margin-top: 2px;
	}

	.export-arrow {
		font-size: 20px;
		color: #C7C7CC;
	}

	.clue-count {
		font-size: 13px;
		color: #8E8E93;
		padding: 4px 20px 8px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px 20px;
		background: #FFFFFF;
		margin: 0 16px;
		border-radius: 16px;
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: 14px;
		opacity: 0.4;
	}

	.empty-title {
		font-size: 17px;
		font-weight: 600;
		color: #3C3C43;
		margin-bottom: 8px;
	}

	.empty-desc {
		font-size: 14px;
		color: #8E8E93;
		text-align: center;
		line-height: 1.5;
		margin-bottom: 20px;
		white-space: pre-line;
	}

	.empty-add-btn {
		background-color: #EEF4FF;
		padding: 10px 32px;
		border-radius: 12px;
	}

	.empty-add-text {
		font-size: 16px;
		font-weight: 500;
		color: #007AFF;
	}

	.clue-list {
		padding: 0 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.clue-item {
		background: #FFFFFF;
		border-radius: 12px;
		padding: 14px 16px;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 12px;
	}

	.clue-item-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.clue-item-icon-text {
		font-size: 20px;
	}

	.clue-item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.clue-item-title {
		font-size: 16px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.clue-item-sub {
		font-size: 13px;
		color: #8E8E93;
	}

	.clue-item-arrow {
		font-size: 20px;
		color: #C7C7CC;
		align-self: center;
	}
</style>
