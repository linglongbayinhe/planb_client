"use strict";
const common_vendor = require("../common/vendor.js");
const store_index = require("../store/index.js");
const _sfc_main = {
  name: "SendView",
  data() {
    return {
      statusBarHeight: 44,
      emailInput: "",
      phoneInput: "",
      notifyExpanded: false
    };
  },
  computed: {
    planEnabled() {
      return store_index.store.sendPlan.enabled;
    },
    emails: {
      get() {
        return store_index.store.sendPlan.emails || [];
      },
      set(v) {
        store_index.mutations.updateSendPlan({ emails: v });
      }
    },
    phones: {
      get() {
        return store_index.store.sendPlan.phones || [];
      },
      set(v) {
        store_index.mutations.updateSendPlan({ phones: v });
      }
    },
    displayName: {
      get() {
        return store_index.store.sendPlan.displayName || "";
      },
      set(v) {
        store_index.mutations.updateSendPlan({ displayName: v });
      }
    },
    customGuide: {
      get() {
        return store_index.store.sendPlan.customGuide || "";
      },
      set(v) {
        store_index.mutations.updateSendPlan({ customGuide: v });
      }
    },
    intervalDays() {
      return store_index.store.sendPlan.intervalDays || 7;
    },
    formattedSendDate() {
      const d = store_index.store.sendPlan.sendDate ? new Date(store_index.store.sendPlan.sendDate) : null;
      if (!d || !this.planEnabled)
        return "—";
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${year}年${month}月${day}日`;
    }
  },
  mounted() {
    common_vendor.index.getSystemInfo({
      success: (info) => {
        this.statusBarHeight = info.statusBarHeight || 44;
      }
    });
  },
  methods: {
    addEmail() {
      const email = this.emailInput.trim();
      if (!email || this.emails.length >= 3)
        return;
      store_index.mutations.updateSendPlan({ emails: [...this.emails, email] });
      this.emailInput = "";
    },
    addPhone() {
      const phone = this.phoneInput.trim();
      if (!phone || this.phones.length >= 3)
        return;
      store_index.mutations.updateSendPlan({ phones: [...this.phones, phone] });
      this.phoneInput = "";
    },
    removeEmail(i) {
      const list = [...this.emails];
      list.splice(i, 1);
      store_index.mutations.updateSendPlan({ emails: list });
    },
    removePhone(i) {
      const list = [...this.phones];
      list.splice(i, 1);
      store_index.mutations.updateSendPlan({ phones: list });
    },
    saveDisplayName() {
      store_index.mutations.updateSendPlan({ displayName: this.displayName });
    },
    saveCustomGuide() {
      store_index.mutations.updateSendPlan({ customGuide: this.customGuide });
    },
    toggleNotifyExpand() {
      this.notifyExpanded = !this.notifyExpanded;
    },
    onSliderChange(e) {
      const days = e.detail.value;
      store_index.mutations.updateSendPlan({ intervalDays: days });
      if (this.planEnabled) {
        const newDate = /* @__PURE__ */ new Date();
        newDate.setDate(newDate.getDate() + days);
        store_index.mutations.updateSendPlan({ sendDate: newDate.toISOString() });
      }
    },
    onSliderChanging(e) {
      store_index.mutations.updateSendPlan({ intervalDays: e.detail.value });
    },
    togglePlan() {
      if (this.planEnabled) {
        store_index.mutations.updateSendPlan({ enabled: false });
      } else {
        const days = store_index.store.sendPlan.intervalDays || 7;
        const newDate = /* @__PURE__ */ new Date();
        newDate.setDate(newDate.getDate() + days);
        store_index.mutations.updateSendPlan({
          enabled: true,
          sendDate: newDate.toISOString()
        });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.t($options.planEnabled ? "已开启" : "已暂停"),
    c: common_vendor.n($options.planEnabled ? "badge-active" : "badge-paused"),
    d: $data.emailInput,
    e: common_vendor.o(($event) => $data.emailInput = $event.detail.value),
    f: !$data.emailInput.trim() || $options.emails.length >= 3 ? 1 : "",
    g: common_vendor.o((...args) => $options.addEmail && $options.addEmail(...args)),
    h: $data.phoneInput,
    i: common_vendor.o(($event) => $data.phoneInput = $event.detail.value),
    j: !$data.phoneInput.trim() || $options.phones.length >= 3 ? 1 : "",
    k: common_vendor.o((...args) => $options.addPhone && $options.addPhone(...args)),
    l: common_vendor.f($options.emails, (email, i, i0) => {
      return {
        a: common_vendor.t(email),
        b: common_vendor.o(($event) => $options.removeEmail(i), "e" + i),
        c: "e" + i
      };
    }),
    m: common_vendor.f($options.phones, (phone, i, i0) => {
      return {
        a: common_vendor.t(phone),
        b: common_vendor.o(($event) => $options.removePhone(i), "p" + i),
        c: "p" + i
      };
    }),
    n: common_vendor.o((...args) => $options.saveDisplayName && $options.saveDisplayName(...args)),
    o: $options.displayName,
    p: common_vendor.o(($event) => $options.displayName = $event.detail.value),
    q: common_vendor.t($data.notifyExpanded ? "∧" : "∨"),
    r: common_vendor.o((...args) => $options.toggleNotifyExpand && $options.toggleNotifyExpand(...args)),
    s: $data.notifyExpanded
  }, $data.notifyExpanded ? {
    t: common_vendor.t($options.displayName || "（未设置）"),
    v: common_vendor.t($options.displayName || "（未设置）"),
    w: common_vendor.o((...args) => $options.saveCustomGuide && $options.saveCustomGuide(...args)),
    x: $options.customGuide,
    y: common_vendor.o(($event) => $options.customGuide = $event.detail.value)
  } : {}, {
    z: common_vendor.t($options.formattedSendDate),
    A: common_vendor.t($options.intervalDays),
    B: $options.intervalDays,
    C: common_vendor.o((...args) => $options.onSliderChange && $options.onSliderChange(...args)),
    D: common_vendor.o((...args) => $options.onSliderChanging && $options.onSliderChanging(...args)),
    E: common_vendor.t($options.planEnabled ? "⏸" : "▶"),
    F: common_vendor.t($options.planEnabled ? "关闭发送计划" : "开启发送计划"),
    G: common_vendor.n($options.planEnabled ? "plan-btn-off" : "plan-btn-on"),
    H: common_vendor.o((...args) => $options.togglePlan && $options.togglePlan(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b8a25f91"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/SendView.js.map
