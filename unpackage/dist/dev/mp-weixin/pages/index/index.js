"use strict";
const common_vendor = require("../../common/vendor.js");
const store_index = require("../../store/index.js");
const HomeView = () => "../../components/HomeView.js";
const CluesView = () => "../../components/CluesView.js";
const SendView = () => "../../components/SendView.js";
const SettingsView = () => "../../components/SettingsView.js";
const _sfc_main = {
  components: {
    HomeView,
    CluesView,
    SendView,
    SettingsView
  },
  data() {
    return {
      currentTab: 0,
      safeAreaBottom: 0,
      booting: true,
      showAuthGate: false,
      authLoading: false,
      // Tab 图标须用 PNG（微信小程序 image 用 SVG 易导致启动报错 [] [object Object]）
      // 若已添加 home/clues/send/settings 的 png，可改为对应路径；否则先用 play/pause 占位
      tabs: [
        { label: "首页", icon: "/static/icons/home.png", iconActive: "/static/icons/home-active.png" },
        { label: "线索库", icon: "/static/icons/clues.png", iconActive: "/static/icons/clues-active.png" },
        { label: "发送", icon: "/static/icons/send.png", iconActive: "/static/icons/send-active.png" },
        { label: "设置", icon: "/static/icons/settings.png", iconActive: "/static/icons/settings-active.png" }
      ]
    };
  },
  onLoad() {
    try {
      const info = typeof common_vendor.index.getWindowInfo === "function" ? common_vendor.index.getWindowInfo() : null;
      this.safeAreaBottom = info && info.safeAreaInsets && info.safeAreaInsets.bottom || 0;
    } catch (e) {
      this.safeAreaBottom = 0;
    }
    this.bootstrapLogin();
    if (typeof common_vendor.index !== "undefined" && typeof common_vendor.index.$on === "function") {
      common_vendor.index.$on("require-login", this.requireLoginThenOpenSettings);
    }
  },
  onUnload() {
    if (typeof common_vendor.index !== "undefined" && typeof common_vendor.index.$off === "function") {
      common_vendor.index.$off("require-login", this.requireLoginThenOpenSettings);
    }
  },
  onShow() {
    if (!store_index.store.currentUser && !this.booting && !store_index.mutations.hasValidSession()) {
      this.showAuthGate = true;
    }
  },
  methods: {
    resolveProvider() {
      let provider = "";
      provider = "weixin";
      return provider;
    },
    async bootstrapLogin() {
      this.booting = true;
      this.showAuthGate = false;
      if (store_index.mutations.hasValidSession()) {
        const ok = await this.pullBootstrapFromCloud();
        if (ok) {
          this.booting = false;
          return;
        }
      }
      store_index.mutations.clearAuthSession();
      this.showAuthGate = true;
      this.booting = false;
    },
    async pullBootstrapFromCloud() {
      try {
        const obj = common_vendor._r.importObject("user_profile", { customUI: true });
        const res = await obj.getBootstrap();
        if (!res || res.errCode !== 0)
          return false;
        store_index.mutations.applyUserBootstrap({
          user: res.userInfo,
          plan: res.plan
        });
        return true;
      } catch (e) {
        return false;
      }
    },
    async handleAuthorize() {
      if (this.authLoading)
        return;
      const provider = this.resolveProvider();
      if (!provider) {
        common_vendor.index.showToast({ title: "当前平台授权登录暂未开通", icon: "none" });
        return;
      }
      this.authLoading = true;
      common_vendor.index.showLoading({ title: "授权中...", mask: true });
      try {
        const loginRes = await new Promise((resolve, reject) => {
          common_vendor.index.login({
            provider,
            success: resolve,
            fail: reject
          });
        });
        const code = loginRes && loginRes.code;
        if (!code)
          throw new Error("未获取到登录凭证");
        const obj = common_vendor._r.importObject("auth_provider", { customUI: true });
        const result = await obj.loginByProvider(provider, code, {});
        if (!result || result.code !== 0 || !result.token) {
          common_vendor.index.__f__("error", "at pages/index/index.vue:168", "[auth_provider/loginByProvider] fail result:", result);
          throw new Error(result && result.message || "授权登录失败");
        }
        store_index.mutations.saveAuthToken({
          token: result.token,
          tokenExpired: result.tokenExpired
        });
        const ok = await this.pullBootstrapFromCloud();
        if (!ok)
          throw new Error("初始化用户数据失败，请重试");
        this.showAuthGate = false;
      } catch (e) {
        store_index.mutations.clearAuthSession();
        common_vendor.index.showToast({ title: e && e.message || "授权登录失败", icon: "none" });
      } finally {
        this.authLoading = false;
        common_vendor.index.hideLoading();
      }
    },
    handleCancel() {
      if (typeof common_vendor.index.exitMiniProgram === "function") {
        common_vendor.index.exitMiniProgram({
          fail: () => {
            common_vendor.index.showToast({ title: "已取消登录", icon: "none" });
          }
        });
      } else {
        common_vendor.index.showToast({ title: "已取消登录", icon: "none" });
      }
    },
    requireLoginThenOpenSettings() {
      if (this.booting)
        return;
      this.currentTab = 3;
      if (typeof common_vendor.index !== "undefined" && typeof common_vendor.index.$emit === "function") {
        common_vendor.index.$emit("open-login-sheet");
      }
    },
    switchTab(index) {
      if (this.showAuthGate || this.booting)
        return;
      this.currentTab = index;
    }
  }
};
if (!Array) {
  const _component_HomeView = common_vendor.resolveComponent("HomeView");
  const _component_CluesView = common_vendor.resolveComponent("CluesView");
  const _component_SendView = common_vendor.resolveComponent("SendView");
  const _component_SettingsView = common_vendor.resolveComponent("SettingsView");
  (_component_HomeView + _component_CluesView + _component_SendView + _component_SettingsView)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.currentTab === 0,
    b: common_vendor.o($options.switchTab, "97"),
    c: $data.currentTab === 1,
    d: $data.currentTab === 2,
    e: $data.currentTab === 3,
    f: common_vendor.f($data.tabs, (tab, i, i0) => {
      return {
        a: $data.currentTab === i ? tab.iconActive : tab.icon,
        b: common_vendor.t(tab.label),
        c: $data.currentTab === i ? 1 : "",
        d: i,
        e: $data.currentTab === i ? 1 : "",
        f: common_vendor.o(($event) => $options.switchTab(i), i)
      };
    }),
    g: $data.safeAreaBottom + "px",
    h: $data.booting
  }, $data.booting ? {} : $data.showAuthGate ? {
    j: common_vendor.o((...args) => $options.handleAuthorize && $options.handleAuthorize(...args), "c2"),
    k: common_vendor.o((...args) => $options.handleCancel && $options.handleCancel(...args), "b9")
  } : {}, {
    i: $data.showAuthGate
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
