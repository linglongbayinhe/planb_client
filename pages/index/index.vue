<template>
	<view class="app-root">
		<!-- 各Tab内容区域 -->
		<view class="tab-content">
			<HomeView v-show="currentTab === 0" @switch-tab="switchTab" />
			<CluesView v-show="currentTab === 1" />
			<SendView v-show="currentTab === 2" />
			<SettingsView v-show="currentTab === 3" />
		</view>

		<!-- 自定义底部导航栏 -->
		<view class="tab-bar" :style="{ paddingBottom: safeAreaBottom + 'px' }">
			<view
				v-for="(tab, i) in tabs"
				:key="i"
				class="tab-item"
				:class="{ active: currentTab === i }"
				@click="switchTab(i)"
			>
				<image
					:src="currentTab === i ? tab.iconActive : tab.icon"
					class="tab-icon"
					mode="aspectFit"
				/>
				<text class="tab-label" :class="{ 'tab-label-active': currentTab === i }">{{ tab.label }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import HomeView from '../../components/HomeView.vue'
	import CluesView from '../../components/CluesView.vue'
	import SendView from '../../components/SendView.vue'
	import SettingsView from '../../components/SettingsView.vue'

	export default {
		components: {
			HomeView,
			CluesView,
			SendView,
			SettingsView
		},
		data() {
			return {
				currentTab: 0,
				safeAreaBottom: 0,
				tabs: [
					{
						label: '首页',
						icon: '/static/icons/home.svg',
						iconActive: '/static/icons/home-active.svg'
					},
					{
						label: '线索库',
						icon: '/static/icons/clues.svg',
						iconActive: '/static/icons/clues-active.svg'
					},
					{
						label: '发送',
						icon: '/static/icons/send.svg',
						iconActive: '/static/icons/send-active.svg'
					},
					{
						label: '设置',
						icon: '/static/icons/settings.svg',
						iconActive: '/static/icons/settings-active.svg'
					}
				]
			}
		},
		onLoad() {
			uni.getSystemInfo({
				success: (info) => {
					this.safeAreaBottom = info.safeAreaInsets ? info.safeAreaInsets.bottom : 0
				}
			})
		},
		methods: {
			switchTab(index) {
				this.currentTab = index
			}
		}
	}
</script>

<style>
	.app-root {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #F2F2F7;
		overflow: hidden;
	}

	.tab-content {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.tab-bar {
		display: flex;
		flex-direction: row;
		background-color: rgba(249, 249, 249, 0.94);
		border-top: 0.5px solid rgba(60, 60, 67, 0.18);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 8px 0 4px;
		cursor: pointer;
	}

	.tab-icon {
		width: 26px;
		height: 26px;
		margin-bottom: 3px;
	}

	.tab-label {
		font-size: 10px;
		color: #8E8E93;
		font-weight: 400;
		line-height: 1;
	}

	.tab-label-active {
		color: #007AFF;
	}
</style>
