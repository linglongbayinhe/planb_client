<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	page {
		background-color: #F2F2F7;
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif;
		box-sizing: border-box;
	}
	
	/* 全局卡片样式 */
	.card {
		background: #FFFFFF;
		border-radius: 12px;
		overflow: hidden;
	}
	
	/* 全局按钮样式 */
	.btn-primary {
		background: #007AFF;
		color: #FFFFFF;
		border-radius: 12px;
		font-size: 17px;
		font-weight: 600;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.btn-danger {
		background: #FF3B30;
		color: #FFFFFF;
		border-radius: 12px;
		font-size: 17px;
		font-weight: 600;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
