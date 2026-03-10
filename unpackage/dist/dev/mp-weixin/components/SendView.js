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
    common_vendor.index.getSystemInfo({
      success: (info) => {
        this.statusBarHeight = info.statusBarHeight || 44;
      }
    });
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
    a: $data.statusBarHeight + "px",
    b: common_vendor.t($options.planEnabled ? "已开启" : "已暂停"),
    c: common_vendor.n($options.planEnabled ? "badge-active" : "badge-paused"),
    d: $options.emails.length < $data.maxEmails
  }, $options.emails.length < $data.maxEmails ? {
    e: $data.emailInput,
    f: common_vendor.o(($event) => $data.emailInput = $event.detail.value),
    g: !$data.emailInput.trim() ? 1 : "",
    h: common_vendor.o((...args) => $options.addEmail && $options.addEmail(...args))
  } : {}, {
    i: $options.emails.length < $data.maxEmails
  }, $options.emails.length < $data.maxEmails ? {} : {}, {
    j: $options.phones.length < $data.maxPhones
  }, $options.phones.length < $data.maxPhones ? {
    k: $data.phoneInput,
    l: common_vendor.o(($event) => $data.phoneInput = $event.detail.value),
    m: !$data.phoneInput.trim() ? 1 : "",
    n: common_vendor.o((...args) => $options.addPhone && $options.addPhone(...args))
  } : {}, {
    o: $options.phones.length < $data.maxPhones || $options.emails.length > 0
  }, $options.phones.length < $data.maxPhones || $options.emails.length > 0 ? {} : {}, {
    p: common_vendor.f($options.emails, (email, i, i0) => {
      return {
        a: common_vendor.t(i + 1),
        b: common_vendor.t(email),
        c: common_vendor.o(($event) => $options.removeEmail(i), "e" + i),
        d: "e" + i
      };
    }),
    q: common_vendor.t($data.maxEmails),
    r: common_vendor.f($options.phones, (phone, i, i0) => {
      return {
        a: common_vendor.t(i + 1),
        b: common_vendor.t(phone),
        c: common_vendor.o(($event) => $options.removePhone(i), "p" + i),
        d: "p" + i
      };
    }),
    s: common_vendor.t($data.maxPhones),
    t: common_vendor.o((...args) => $options.saveDisplayName && $options.saveDisplayName(...args)),
    v: $options.displayName,
    w: common_vendor.o(($event) => $options.displayName = $event.detail.value),
    x: common_vendor.t($data.notifyExpanded ? "∧" : "∨"),
    y: common_vendor.o((...args) => $options.toggleNotifyExpand && $options.toggleNotifyExpand(...args)),
    z: $data.notifyExpanded
  }, $data.notifyExpanded ? {
    A: common_vendor.t($options.displayName || "（未设置）"),
    B: common_vendor.t($options.displayName || "（未设置）"),
    C: common_vendor.o((...args) => $options.saveCustomGuide && $options.saveCustomGuide(...args)),
    D: $options.customGuide,
    E: common_vendor.o(($event) => $options.customGuide = $event.detail.value)
  } : {}, {
    F: common_vendor.t($options.formattedSendDate),
    G: common_vendor.t($options.intervalDays),
    H: $options.intervalDays,
    I: common_vendor.o((...args) => $options.onSliderChange && $options.onSliderChange(...args)),
    J: common_vendor.o((...args) => $options.onSliderChanging && $options.onSliderChanging(...args)),
    K: $options.planEnabled ? "/static/icons/pause.png" : "/static/icons/play.png",
    L: common_vendor.t($options.planEnabled ? "关闭发送计划" : "开启发送计划"),
    M: common_vendor.n($options.planEnabled ? "plan-btn-off" : "plan-btn-on"),
    N: common_vendor.o((...args) => $options.togglePlan && $options.togglePlan(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b8a25f91"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/SendView.js.map
