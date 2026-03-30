"use strict";
const common_vendor = require("../common/vendor.js");
const store_index = require("../store/index.js");
const scripts_sendPlanCloud = require("../scripts/sendPlanCloud.js");
const _sfc_main = {
  name: "HomeView",
  emits: ["switch-tab"],
  data() {
    return {
      statusBarHeight: 44,
      timeoutId: null,
      now: /* @__PURE__ */ new Date()
    };
  },
  computed: {
    planEnabled() {
      return store_index.store.sendPlan.enabled;
    },
    sendDate() {
      return store_index.store.sendPlan.sendDate ? new Date(store_index.store.sendPlan.sendDate) : null;
    },
    countdownDays() {
      if (!this.sendDate || !this.planEnabled)
        return "--";
      const diff = this.sendDate - this.now;
      if (diff <= 0)
        return 0;
      return Math.floor(diff / (1e3 * 60 * 60 * 24));
    },
    timeStr() {
      if (!this.sendDate || !this.planEnabled) {
        return { hh: "--", mm: "--", ss: "--" };
      }
      const diff = this.sendDate - this.now;
      if (diff <= 0)
        return { hh: "00", mm: "00", ss: "00" };
      const totalSecs = Math.floor(diff / 1e3);
      const hh = Math.floor(totalSecs % 86400 / 3600);
      const mm = Math.floor(totalSecs % 3600 / 60);
      const ss = totalSecs % 60;
      return {
        hh: String(hh).padStart(2, "0"),
        mm: String(mm).padStart(2, "0"),
        ss: String(ss).padStart(2, "0")
      };
    },
    formattedSendDate() {
      if (!this.planEnabled)
        return "暂未开启发送计划";
      if (!this.sendDate)
        return "点击下方「刷新倒计时」计算";
      const d = this.sendDate;
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      return `${year}年${month}月${day}日 ${h12}:${mins}${ampm}`;
    }
  },
  onShow() {
    this.startSyncedCountdown();
  },
  onHide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  },
  mounted() {
    try {
      const info = typeof common_vendor.index.getWindowInfo === "function" ? common_vendor.index.getWindowInfo() : null;
      this.statusBarHeight = info && info.statusBarHeight || 44;
    } catch (e) {
      this.statusBarHeight = 44;
    }
    this.startSyncedCountdown();
  },
  beforeDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  },
  methods: {
    showSendPlanError(err, fallback = "云端同步失败，已保存到本地") {
      common_vendor.index.showToast({
        title: err && err.errMsg || fallback,
        icon: "none",
        duration: 2e3
      });
    },
    startSyncedCountdown() {
      if (this.timeoutId)
        clearTimeout(this.timeoutId);
      const now = /* @__PURE__ */ new Date();
      this.now = now;
      if (!this.sendDate || !this.planEnabled)
        return;
      const delay = 1e3 - now.getMilliseconds();
      this.timeoutId = setTimeout(() => {
        this.now = /* @__PURE__ */ new Date();
        this.startSyncedCountdown();
      }, delay);
    },
    async handleRefresh() {
      if (!this.planEnabled) {
        common_vendor.index.showToast({ title: "请先开启发送计划", icon: "none" });
        return;
      }
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      const intervalDays = store_index.store.sendPlan.intervalDays || 7;
      const newSendDate = /* @__PURE__ */ new Date();
      newSendDate.setDate(newSendDate.getDate() + intervalDays);
      const newSendDateISO = newSendDate.toISOString();
      const newSendDateMs = newSendDate.getTime();
      store_index.mutations.updateSendPlan({ sendDate: newSendDateISO });
      this.startSyncedCountdown();
      common_vendor.index.vibrateShort && common_vendor.index.vibrateShort({ type: "light" });
      const res = await scripts_sendPlanCloud.syncSendPlanToCloud({ sendDate: newSendDateMs }, {
        onError: (err) => this.showSendPlanError(err)
      });
      if (res && res.errCode)
        return;
    },
    goToClues() {
      common_vendor.index.vibrateShort && common_vendor.index.vibrateShort({ type: "light" });
      this.$emit("switch-tab", 1);
    },
    goToSend() {
      common_vendor.index.vibrateShort && common_vendor.index.vibrateShort({ type: "light" });
      this.$emit("switch-tab", 2);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.t($options.planEnabled ? "已开启" : "已暂停"),
    c: common_vendor.n($options.planEnabled ? "badge-active" : "badge-paused"),
    d: common_vendor.t($options.countdownDays),
    e: common_vendor.t($options.timeStr.hh),
    f: common_vendor.t($options.timeStr.mm),
    g: common_vendor.t($options.timeStr.ss),
    h: common_vendor.t($options.formattedSendDate),
    i: !$options.planEnabled ? 1 : "",
    j: common_vendor.o((...args) => $options.handleRefresh && $options.handleRefresh(...args), "7f"),
    k: common_vendor.o((...args) => $options.goToClues && $options.goToClues(...args), "fc"),
    l: common_vendor.o((...args) => $options.goToSend && $options.goToSend(...args), "6b")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-f29a63c4"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/HomeView.js.map
