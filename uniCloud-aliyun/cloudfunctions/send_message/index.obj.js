'use strict'

const { createSendPlanService } = require('send-plan')

module.exports = {
	_before() {
		this._sendPlan = createSendPlanService(this)
	},

	async updateSendMessage(displayName, message, uid) {
		return this._sendPlan.updateSendMessage(displayName, message, uid)
	}
}
