'use strict'

const { createSendPlanService } = require('send-plan')

module.exports = {
	_before() {
		this._sendPlan = createSendPlanService(this)
	},

	async updateSendPhone(phone, isNew, uid) {
		return this._sendPlan.updateSendPhone(phone, isNew, uid)
	}
}
