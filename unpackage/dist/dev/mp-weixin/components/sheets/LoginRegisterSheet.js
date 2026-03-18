"use strict";
const common_vendor = require("../../common/vendor.js");
const store_index = require("../../store/index.js");
const _sfc_main = {
  name: "LoginRegisterSheet",
  props: {
    cancelMode: {
      type: String,
      default: "close"
      // close | exit
    }
  },
  emits: ["close", "success", "cancel"],
  methods: {
    resolveProvider() {
      let provider = "";
      provider = "weixin";
      return provider;
    },
    async handleAuthorize() {
      const provider = this.resolveProvider();
      if (!provider) {
        common_vendor.index.showToast({ title: "当前平台授权登录暂未开通", icon: "none" });
        return;
      }
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
        const res = await obj.loginByProvider(provider, code, {});
        if (!res || res.code !== 0 || !res.token) {
          common_vendor.index.__f__("error", "at components/sheets/LoginRegisterSheet.vue:68", "[auth_provider/loginByProvider] fail result:", res);
          throw new Error(res && res.message || "授权登录失败");
        }
        store_index.mutations.saveAuthToken({
          token: res.token,
          tokenExpired: res.tokenExpired
        });
        const profileObj = common_vendor._r.importObject("user_profile", { customUI: true });
        const profileRes = await profileObj.getBootstrap();
        if (profileRes && profileRes.errCode === 0) {
          store_index.mutations.applyUserBootstrap({
            user: profileRes.userInfo,
            plan: profileRes.plan
          });
        } else if (res.userInfo) {
          store_index.mutations.setUser({
            _id: res.userInfo._id,
            email: res.userInfo.email || "",
            nickname: res.userInfo.nickname || "",
            avatar: res.userInfo.avatar || ""
          });
        }
        this.$emit("success");
        this.$emit("close");
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "授权登录失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    handleCancel() {
      this.$emit("cancel");
      if (this.cancelMode === "exit") {
        if (typeof common_vendor.index.exitMiniProgram === "function") {
          common_vendor.index.exitMiniProgram({
            fail: () => {
              common_vendor.index.showToast({ title: "已取消登录", icon: "none" });
            }
          });
        } else {
          common_vendor.index.showToast({ title: "已取消登录", icon: "none" });
        }
      } else {
        this.$emit("close");
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.handleAuthorize && $options.handleAuthorize(...args), "60"),
    b: common_vendor.o((...args) => $options.handleCancel && $options.handleCancel(...args), "a0"),
    c: common_vendor.o(() => {
    }, "5b"),
    d: common_vendor.o((...args) => $options.handleCancel && $options.handleCancel(...args), "dc")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5a44606c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/LoginRegisterSheet.js.map
