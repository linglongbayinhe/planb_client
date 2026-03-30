'use strict'

const { createSendPlanService } = require('send-plan')

module.exports = {
	_before() {
		this._sendPlan = createSendPlanService(this)
	},

	async updateSendTime(sendDate, uid) {
		return this._sendPlan.updateSendTime(sendDate, uid)
	}
}
