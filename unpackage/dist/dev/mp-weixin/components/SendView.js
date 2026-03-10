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
      notifyExpanded: false,
      maxEmails: 3,
      maxPhones: 3
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
    try {
      const info = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = info.statusBarHeight ?? 44;
    } catch (e) {
      this.statusBarHeight = 44;
    }
  },
  methods: {
    addEmail() {
      const email = this.emailInput.trim().toLowerCase();
      if (!email)
        return;
      const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailReg.test(email)) {
        common_vendor.index.showToast({ title: "请输入有效的邮箱地址", icon: "none" });
        return;
      }
      if (this.emails.length >= this.maxEmails)
        return;
      if (this.emails.map((e) => e.toLowerCase()).includes(email)) {
        common_vendor.index.showToast({ title: "该邮箱已存在", icon: "none" });
        return;
      }
      store_index.mutations.updateSendPlan({ emails: [...this.emails, this.emailInput.trim()] });
      this.emailInput = "";
    },
    addPhone() {
      const phone = this.phoneInput.trim();
      if (!phone)
        return;
      const phoneReg = /^1[3-9]\d{9}$/;
      if (!phoneReg.test(phone)) {
        common_vendor.index.showToast({ title: "请输入有效的手机号", icon: "none" });
        return;
      }
      if (this.phones.length >= this.maxPhones)
        return;
      if (this.phones.includes(phone)) {
        common_vendor.index.showToast({ title: "该手机号已存在", icon: "none" });
        return;
      }
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
    },
    onSliderChanging(e) {
      store_index.mutations.updateSendPlan({ intervalDays: e.detail.value });
    },
    togglePlan() {
      if (this.planEnabled) {
        store_index.mutations.updateSendPlan({ enabled: false });
      } else {
        store_index.mutations.updateSendPlan({ enabled: true });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($options.planEnabled ? "已开启" : "已暂停"),
    b: common_vendor.n($options.planEnabled ? "badge-active" : "badge-paused"),
    c: $options.emails.length < $data.maxEmails
  }, $options.emails.length < $data.maxEmails ? {
    d: $data.emailInput,
    e: common_vendor.o(($event) => $data.emailInput = $event.detail.value),
    f: !$data.emailInput.trim() ? 1 : "",
    g: common_vendor.o((...args) => $options.addEmail && $options.addEmail(...args))
  } : {}, {
    h: $options.emails.length < $data.maxEmails
  }, $options.emails.length < $data.maxEmails ? {} : {}, {
    i: $options.phones.length < $data.maxPhones
  }, $options.phones.length < $data.maxPhones ? {
    j: $data.phoneInput,
    k: common_vendor.o(($event) => $data.phoneInput = $event.detail.value),
    l: !$data.phoneInput.trim() ? 1 : "",
    m: common_vendor.o((...args) => $options.addPhone && $options.addPhone(...args))
  } : {}, {
    n: $options.phones.length < $data.maxPhones || $options.emails.length > 0
  }, $options.phones.length < $data.maxPhones || $options.emails.length > 0 ? {} : {}, {
    o: common_vendor.f($options.emails, (email, i, i0) => {
      return {
        a: common_vendor.t(i + 1),
        b: common_vendor.t(email),
        c: common_vendor.o(($event) => $options.removeEmail(i), "e" + i),
        d: "e" + i
      };
    }),
    p: common_vendor.t($data.maxEmails),
    q: common_vendor.f($options.phones, (phone, i, i0) => {
      return {
        a: common_vendor.t(i + 1),
        b: common_vendor.t(phone),
        c: common_vendor.o(($event) => $options.removePhone(i), "p" + i),
        d: "p" + i
      };
    }),
    r: common_vendor.t($data.maxPhones),
    s: common_vendor.o((...args) => $options.saveDisplayName && $options.saveDisplayName(...args)),
    t: $options.displayName,
    v: common_vendor.o(($event) => $options.displayName = $event.detail.value),
    w: common_vendor.t($data.notifyExpanded ? "∧" : "∨"),
    x: common_vendor.o((...args) => $options.toggleNotifyExpand && $options.toggleNotifyExpand(...args)),
    y: $data.notifyExpanded
  }, $data.notifyExpanded ? {
    z: common_vendor.t($options.displayName || "（未设置）"),
    A: common_vendor.t($options.displayName || "（未设置）"),
    B: common_vendor.o((...args) => $options.saveCustomGuide && $options.saveCustomGuide(...args)),
    C: $options.customGuide,
    D: common_vendor.o(($event) => $options.customGuide = $event.detail.value)
  } : {}, {
    E: common_vendor.t($options.formattedSendDate),
    F: common_vendor.t($options.intervalDays),
    G: $options.intervalDays,
    H: common_vendor.o((...args) => $options.onSliderChange && $options.onSliderChange(...args)),
    I: common_vendor.o((...args) => $options.onSliderChanging && $options.onSliderChanging(...args)),
    J: $options.planEnabled ? "/static/icons/pause.png" : "/static/icons/play.png",
    K: common_vendor.t($options.planEnabled ? "关闭发送计划" : "开启发送计划"),
    L: common_vendor.n($options.planEnabled ? "plan-btn-off" : "plan-btn-on"),
    M: common_vendor.o((...args) => $options.togglePlan && $options.togglePlan(...args)),
    N: ($data.statusBarHeight || 0) + "px"
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b8a25f91"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/SendView.js.map
