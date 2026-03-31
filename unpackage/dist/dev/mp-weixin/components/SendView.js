"use strict";
const common_vendor = require("../common/vendor.js");
const store_index = require("../store/index.js");
const scripts_sendPlanCloud = require("../scripts/sendPlanCloud.js");
const _sfc_main = {
  name: "SendView",
  data() {
    return {
      statusBarHeight: 44,
      emailInput: "",
      phoneInput: "",
      notifyExpanded: false,
      sendCheckLoading: false,
      sendDryRunLoading: false,
      maxEmails: 3,
      maxPhones: 3,
      displayNameLocal: "",
      customGuideLocal: "",
      appliedDisplayName: "",
      appliedCustomGuide: ""
    };
  },
  computed: {
    currentUid() {
      const u = store_index.store.currentUser;
      return u && (u._id || u.uid) || "";
    },
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
    contentDirty() {
      return this.displayNameLocal !== this.appliedDisplayName || this.customGuideLocal !== this.appliedCustomGuide;
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
    },
    sendPlanRef() {
      return store_index.store.sendPlan;
    },
    sendCheckBusy() {
      return this.sendCheckLoading || this.sendDryRunLoading;
    }
  },
  watch: {
    sendPlanRef: {
      handler() {
        this.syncContentFromStore();
      },
      deep: true
    }
  },
  mounted() {
    try {
      const info = typeof common_vendor.index.getWindowInfo === "function" ? common_vendor.index.getWindowInfo() : null;
      this.statusBarHeight = (info && info.statusBarHeight) ?? 44;
    } catch (e) {
      this.statusBarHeight = 44;
    }
    this.syncContentFromStore();
  },
  methods: {
    showSendPlanError(err, fallback = "云端同步失败") {
      common_vendor.index.showToast({
        title: err && err.errMsg || fallback,
        icon: "none",
        duration: 2e3
      });
    },
    addEmail() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
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
      const list = [...this.emails, this.emailInput.trim()];
      store_index.mutations.updateSendPlan({ emails: list });
      this.emailInput = "";
      scripts_sendPlanCloud.syncSendPlanToCloud({ emails: list }, {
        onError: (err) => this.showSendPlanError(err)
      });
    },
    addPhone() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
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
      const list = [...this.phones, phone];
      store_index.mutations.updateSendPlan({ phones: list });
      this.phoneInput = "";
      scripts_sendPlanCloud.syncSendPlanToCloud({ phones: list }, {
        onError: (err) => this.showSendPlanError(err)
      });
    },
    removeEmail(i) {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      const removedEmail = this.emails[i];
      const list = [...this.emails];
      list.splice(i, 1);
      store_index.mutations.updateSendPlan({ emails: list });
      if (removedEmail) {
        scripts_sendPlanCloud.syncSendPlanToCloud({ emails: list }, {
          onError: (err) => this.showSendPlanError(err)
        });
      }
    },
    removePhone(i) {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      const removedPhone = this.phones[i];
      const list = [...this.phones];
      list.splice(i, 1);
      store_index.mutations.updateSendPlan({ phones: list });
      if (removedPhone) {
        scripts_sendPlanCloud.syncSendPlanToCloud({ phones: list }, {
          onError: (err) => this.showSendPlanError(err)
        });
      }
    },
    onContentRequireLogin() {
      if (!this.currentUid)
        store_index.mutations.ensureAuthForWriteAction();
    },
    syncContentFromStore() {
      const d = store_index.store.sendPlan.displayName || "";
      const c = store_index.store.sendPlan.customGuide || "";
      this.displayNameLocal = d;
      this.customGuideLocal = c;
      this.appliedDisplayName = d;
      this.appliedCustomGuide = c;
    },
    async applyContent() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      store_index.mutations.updateSendPlan({
        displayName: this.displayNameLocal,
        customGuide: this.customGuideLocal
      });
      this.appliedDisplayName = this.displayNameLocal;
      this.appliedCustomGuide = this.customGuideLocal;
      await scripts_sendPlanCloud.syncSendPlanToCloud({
        displayName: this.displayNameLocal,
        customGuide: this.customGuideLocal
      }, {
        onError: (err) => this.showSendPlanError(err)
      });
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
    async togglePlan() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      const newEnabled = !this.planEnabled;
      store_index.mutations.updateSendPlan({ enabled: newEnabled });
      const res = await scripts_sendPlanCloud.syncSendPlanToCloud({ enabled: newEnabled }, {
        onUidRequired: () => {
          common_vendor.index.showToast({ title: "请先登录以后再同步到云端", icon: "none" });
        },
        onError: (err) => this.showSendPlanError(err, "同步失败")
      });
      if (res && res.errCode)
        return;
    },
    async trigger30Sec() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      const newSendDateMs = Date.now() + 3e4;
      const newSendDateISO = new Date(newSendDateMs).toISOString();
      store_index.mutations.updateSendPlan({ sendDate: newSendDateISO });
      const res = await scripts_sendPlanCloud.syncSendPlanToCloud({ sendDate: newSendDateMs }, {
        onError: (err) => this.showSendPlanError(err, "设置失败")
      });
      if (res && res.errCode)
        return;
      common_vendor.index.showToast({ title: "已更新预计日期为 30 秒后", icon: "success" });
    },
    async runSendCheckTest() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      if (this.sendCheckBusy)
        return;
      this.sendCheckLoading = true;
      common_vendor.index.showLoading({ title: "检测发送中...", mask: true });
      try {
        const res = await common_vendor._r.callFunction({
          name: "plan_send_check"
        });
        const result = res && res.result || {};
        common_vendor.index.__f__("log", "at components/SendView.vue:451", "[SendView][run] plan_send_check result:", result);
        if (result.errCode) {
          throw new Error(result.errMsg || result.message || "执行失败，请稍后重试");
        }
        const processed = Number(result.processed || 0);
        const emailCount = Number(result.email && result.email.total || 0);
        const smsCount = Number(result.sms && result.sms.total || 0);
        common_vendor.index.showToast({
          title: `处理${processed} 邮${emailCount} 短${smsCount}`,
          icon: "none",
          duration: 2500
        });
      } catch (e) {
        common_vendor.index.showToast({
          title: e && e.message || "执行失败，请稍后重试",
          icon: "none",
          duration: 2500
        });
      } finally {
        this.sendCheckLoading = false;
        common_vendor.index.hideLoading();
      }
    },
    async runSendCheckDryRun() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      if (this.sendCheckBusy)
        return;
      this.sendDryRunLoading = true;
      common_vendor.index.showLoading({ title: "模拟检测中...", mask: true });
      try {
        const res = await common_vendor._r.callFunction({
          name: "plan_send_check",
          data: { dryRun: true }
        });
        const result = res && res.result || {};
        common_vendor.index.__f__("log", "at components/SendView.vue:485", "[SendView][dryRun] plan_send_check result:", result);
        if (result.errCode) {
          throw new Error(result.errMsg || result.message || "执行失败，请稍后重试");
        }
        const total = Number(result.totalTasks || 0);
        const emailCount = Number(result.channel && result.channel.email || 0);
        const smsCount = Number(result.channel && result.channel.sms || 0);
        common_vendor.index.showToast({
          title: `模拟 候选${total} 邮${emailCount} 短${smsCount}`,
          icon: "none",
          duration: 2500
        });
      } catch (e) {
        common_vendor.index.showToast({
          title: e && e.message || "执行失败，请稍后重试",
          icon: "none",
          duration: 2500
        });
      } finally {
        this.sendDryRunLoading = false;
        common_vendor.index.hideLoading();
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
    e: common_vendor.o(($event) => $data.emailInput = $event.detail.value, "89"),
    f: !$data.emailInput.trim() ? 1 : "",
    g: common_vendor.o((...args) => $options.addEmail && $options.addEmail(...args), "4b")
  } : {}, {
    h: $options.emails.length < $data.maxEmails
  }, $options.emails.length < $data.maxEmails ? {} : {}, {
    i: $options.phones.length < $data.maxPhones
  }, $options.phones.length < $data.maxPhones ? {
    j: $data.phoneInput,
    k: common_vendor.o(($event) => $data.phoneInput = $event.detail.value, "2e"),
    l: !$data.phoneInput.trim() ? 1 : "",
    m: common_vendor.o((...args) => $options.addPhone && $options.addPhone(...args), "6f")
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
    s: !$options.currentUid,
    t: $data.displayNameLocal,
    v: common_vendor.o(($event) => $data.displayNameLocal = $event.detail.value, "03"),
    w: common_vendor.o((...args) => $options.onContentRequireLogin && $options.onContentRequireLogin(...args), "4f"),
    x: common_vendor.t($data.notifyExpanded ? "∧" : "∨"),
    y: common_vendor.o((...args) => $options.toggleNotifyExpand && $options.toggleNotifyExpand(...args), "1c"),
    z: $data.notifyExpanded
  }, $data.notifyExpanded ? {
    A: common_vendor.t($data.displayNameLocal || "（未设置）"),
    B: common_vendor.t($data.displayNameLocal || "（未设置）"),
    C: !$options.currentUid,
    D: common_vendor.o((...args) => $options.onContentRequireLogin && $options.onContentRequireLogin(...args), "56"),
    E: $data.customGuideLocal,
    F: common_vendor.o(($event) => $data.customGuideLocal = $event.detail.value, "60")
  } : {}, {
    G: $options.contentDirty
  }, $options.contentDirty ? {
    H: common_vendor.o((...args) => $options.applyContent && $options.applyContent(...args), "17")
  } : {}, {
    I: common_vendor.t($options.formattedSendDate),
    J: common_vendor.t($options.intervalDays),
    K: $options.intervalDays,
    L: common_vendor.o((...args) => $options.onSliderChange && $options.onSliderChange(...args), "a8"),
    M: common_vendor.o((...args) => $options.onSliderChanging && $options.onSliderChanging(...args), "35"),
    N: $options.planEnabled ? "/static/icons/pause.png" : "/static/icons/play.png",
    O: common_vendor.t($options.planEnabled ? "关闭发送计划" : "开启发送计划"),
    P: common_vendor.n($options.planEnabled ? "plan-btn-off" : "plan-btn-on"),
    Q: common_vendor.o((...args) => $options.togglePlan && $options.togglePlan(...args), "ad"),
    R: common_vendor.o((...args) => $options.trigger30Sec && $options.trigger30Sec(...args), "3b"),
    S: common_vendor.t($data.sendCheckLoading ? "检测中..." : "检测发送"),
    T: $options.sendCheckBusy ? 1 : "",
    U: common_vendor.o((...args) => $options.runSendCheckTest && $options.runSendCheckTest(...args), "5e"),
    V: common_vendor.t($data.sendDryRunLoading ? "模拟中..." : "模拟检测"),
    W: $options.sendCheckBusy ? 1 : "",
    X: common_vendor.o((...args) => $options.runSendCheckDryRun && $options.runSendCheckDryRun(...args), "ba"),
    Y: ($data.statusBarHeight || 0) + "px"
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b8a25f91"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/SendView.js.map
