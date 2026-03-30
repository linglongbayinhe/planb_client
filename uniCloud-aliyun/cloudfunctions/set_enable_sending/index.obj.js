'use strict'

const { createSendPlanService } = require('send-plan')

module.exports = {
	_before() {
		this._sendPlan = createSendPlanService(this)
	},

	async setEnableSending(enable_sending, uid) {
		return this._sendPlan.setEnableSending(enable_sending, uid)
	}
}
