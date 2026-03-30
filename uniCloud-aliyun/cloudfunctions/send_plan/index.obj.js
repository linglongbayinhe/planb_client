'use strict'

const { createSendPlanService } = require('send-plan')

module.exports = {
  _before() {
    this._sendPlan = createSendPlanService(this)
  },

  async savePlan(patch, uid) {
    return this._sendPlan.savePlan(patch, uid)
  }
}
