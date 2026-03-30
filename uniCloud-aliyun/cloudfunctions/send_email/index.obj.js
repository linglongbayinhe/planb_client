'use strict'

const { createSendPlanService } = require('send-plan')

module.exports = {
	_before() {
		this._sendPlan = createSendPlanService(this)
	},

	async updateSendEmail(email, isNew, uid) {
		return this._sendPlan.updateSendEmail(email, isNew, uid)
	}
}
