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
      sendCheckLoading: false,
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
      store_index.mutations.updateSendPlan({ emails: [...this.emails, this.emailInput.trim()] });
      this.emailInput = "";
      this.syncSendEmailToCloud(email, true);
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
      store_index.mutations.updateSendPlan({ phones: [...this.phones, phone] });
      this.phoneInput = "";
      this.syncSendPhoneToCloud(phone, true);
    },
    removeEmail(i) {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      const removedEmail = this.emails[i];
      const list = [...this.emails];
      list.splice(i, 1);
      store_index.mutations.updateSendPlan({ emails: list });
      if (removedEmail)
        this.syncSendEmailToCloud(removedEmail, false);
    },
    removePhone(i) {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      const removedPhone = this.phones[i];
      const list = [...this.phones];
      list.splice(i, 1);
      store_index.mutations.updateSendPlan({ phones: list });
      if (removedPhone)
        this.syncSendPhoneToCloud(removedPhone, false);
    },
    async syncSendEmailToCloud(email, isNew) {
      const uid = store_index.store.currentUser && (store_index.store.currentUser._id || store_index.store.currentUser.uid);
      if (!uid)
        return;
      try {
        const obj = common_vendor._r.importObject("send_email");
        const res = await obj.updateSendEmail(email, isNew, uid);
        if (res && res.errCode && res.errCode !== "UID_REQUIRED") {
          common_vendor.index.showToast({ title: res.errMsg || "云端同步失败", icon: "none", duration: 2e3 });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "云端同步失败", icon: "none", duration: 2e3 });
      }
    },
    async syncSendPhoneToCloud(phone, isNew) {
      const uid = store_index.store.currentUser && (store_index.store.currentUser._id || store_index.store.currentUser.uid);
      if (!uid)
        return;
      try {
        const obj = common_vendor._r.importObject("send_phone");
        const res = await obj.updateSendPhone(phone, isNew, uid);
        if (res && res.errCode && res.errCode !== "UID_REQUIRED") {
          common_vendor.index.showToast({ title: res.errMsg || "云端同步失败", icon: "none", duration: 2e3 });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "云端同步失败", icon: "none", duration: 2e3 });
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
      await this.syncSendMessageToCloud();
    },
    async syncSendMessageToCloud() {
      const uid = store_index.store.currentUser && (store_index.store.currentUser._id || store_index.store.currentUser.uid);
      if (!uid)
        return;
      try {
        const obj = common_vendor._r.importObject("send_message");
        const res = await obj.updateSendMessage(
          this.displayNameLocal,
          this.customGuideLocal,
          uid
        );
        if (res && res.errCode && res.errCode !== "UID_REQUIRED") {
          common_vendor.index.showToast({ title: res.errMsg || "云端同步失败", icon: "none", duration: 2e3 });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "云端同步失败", icon: "none", duration: 2e3 });
      }
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
      if (this.planEnabled) {
        store_index.mutations.updateSendPlan({ enabled: false });
      } else {
        store_index.mutations.updateSendPlan({ enabled: true });
      }
      let uid = store_index.store.currentUser && (store_index.store.currentUser.uid || store_index.store.currentUser._id);
      if (!uid && typeof common_vendor._r !== "undefined" && typeof common_vendor._r.getCurrentUserInfo === "function") {
        try {
          const u = await common_vendor._r.getCurrentUserInfo();
          uid = u && (u.uid || u._id);
        } catch (e) {
        }
      }
      try {
        const obj = common_vendor._r.importObject("set_enable_sending");
        const res = await obj.setEnableSending(newEnabled, uid || void 0);
        if (res && res.errCode) {
          const msg = res.errCode === "UID_REQUIRED" ? "请先登录以同步到云端" : res.errMsg || "同步失败";
          common_vendor.index.showToast({ title: msg, icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "同步到云端失败", icon: "none" });
      }
    },
    async trigger30Sec() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      try {
        const obj = common_vendor._r.importObject("send_time");
        const res = await obj.updateSendTime(Date.now() + 3e4, this.currentUid);
        if (res && res.errCode) {
          common_vendor.index.showToast({ title: res.errMsg || "设置失败", icon: "none" });
          return;
        }
        common_vendor.index.showToast({ title: "已更新预期日期为 30 秒后", icon: "success" });
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "设置失败", icon: "none" });
      }
    },
    async runSendCheckTest() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      if (this.sendCheckLoading)
        return;
      this.sendCheckLoading = true;
      common_vendor.index.showLoading({ title: "查询发送测试中...", mask: true });
      try {
        const res = await common_vendor._r.callFunction({
          name: "plan_send_check",
          data: {
            clientDebugToken: `send-btn-${Date.now()}`
          }
        });
        const result = res && res.result || {};
        if (result.errCode) {
          throw new Error(result.errMsg || result.message || "执行失败，请稍后重试");
        }
        const processed = Number(result.processed || 0);
        const emailCount = Number(result.email && result.email.count || 0);
        const smsCount = Number(result.sms && result.sms.count || 0);
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
    e: common_vendor.o(($event) => $data.emailInput = $event.detail.value, "ba"),
    f: !$data.emailInput.trim() ? 1 : "",
    g: common_vendor.o((...args) => $options.addEmail && $options.addEmail(...args), "b6")
  } : {}, {
    h: $options.emails.length < $data.maxEmails
  }, $options.emails.length < $data.maxEmails ? {} : {}, {
    i: $options.phones.length < $data.maxPhones
  }, $options.phones.length < $data.maxPhones ? {
    j: $data.phoneInput,
    k: common_vendor.o(($event) => $data.phoneInput = $event.detail.value, "4e"),
    l: !$data.phoneInput.trim() ? 1 : "",
    m: common_vendor.o((...args) => $options.addPhone && $options.addPhone(...args), "60")
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
    v: common_vendor.o(($event) => $data.displayNameLocal = $event.detail.value, "6e"),
    w: common_vendor.o((...args) => $options.onContentRequireLogin && $options.onContentRequireLogin(...args), "24"),
    x: common_vendor.t($data.notifyExpanded ? "∧" : "∨"),
    y: common_vendor.o((...args) => $options.toggleNotifyExpand && $options.toggleNotifyExpand(...args), "dc"),
    z: $data.notifyExpanded
  }, $data.notifyExpanded ? {
    A: common_vendor.t($data.displayNameLocal || "（未设置）"),
    B: common_vendor.t($data.displayNameLocal || "（未设置）"),
    C: !$options.currentUid,
    D: common_vendor.o((...args) => $options.onContentRequireLogin && $options.onContentRequireLogin(...args), "99"),
    E: $data.customGuideLocal,
    F: common_vendor.o(($event) => $data.customGuideLocal = $event.detail.value, "23")
  } : {}, {
    G: $options.contentDirty
  }, $options.contentDirty ? {
    H: common_vendor.o((...args) => $options.applyContent && $options.applyContent(...args), "ec")
  } : {}, {
    I: common_vendor.t($options.formattedSendDate),
    J: common_vendor.t($options.intervalDays),
    K: $options.intervalDays,
    L: common_vendor.o((...args) => $options.onSliderChange && $options.onSliderChange(...args), "b1"),
    M: common_vendor.o((...args) => $options.onSliderChanging && $options.onSliderChanging(...args), "bc"),
    N: $options.planEnabled ? "/static/icons/pause.png" : "/static/icons/play.png",
    O: common_vendor.t($options.planEnabled ? "关闭发送计划" : "开启发送计划"),
    P: common_vendor.n($options.planEnabled ? "plan-btn-off" : "plan-btn-on"),
    Q: common_vendor.o((...args) => $options.togglePlan && $options.togglePlan(...args), "00"),
    R: common_vendor.o((...args) => $options.trigger30Sec && $options.trigger30Sec(...args), "eb"),
    S: common_vendor.t($data.sendCheckLoading ? "查询中..." : "查询发送测试"),
    T: $data.sendCheckLoading ? 1 : "",
    U: common_vendor.o((...args) => $options.runSendCheckTest && $options.runSendCheckTest(...args), "ec"),
    V: ($data.statusBarHeight || 0) + "px"
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b8a25f91"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/SendView.js.map
