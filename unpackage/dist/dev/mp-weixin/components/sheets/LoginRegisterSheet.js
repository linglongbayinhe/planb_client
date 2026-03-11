"use strict";
const common_vendor = require("../../common/vendor.js");
const store_index = require("../../store/index.js");
const _sfc_main = {
  name: "LoginRegisterSheet",
  emits: ["close"],
  data() {
    return {
      mode: "login",
      email: "",
      password: "",
      confirmPassword: "",
      nickname: "",
      errorMsg: ""
    };
  },
  computed: {
    canSubmit() {
      if (!this.email.trim() || !this.password.trim())
        return false;
      if (this.mode === "register") {
        return this.password.length >= 6 && this.password === this.confirmPassword;
      }
      return true;
    },
    confirmPasswordMismatch() {
      if (this.mode !== "register")
        return false;
      return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
    }
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    clearError() {
      this.errorMsg = "";
      if (this.mode === "login") {
        this.confirmPassword = "";
      }
    },
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    async onSubmit() {
      if (!this.canSubmit)
        return;
      this.errorMsg = "";
      if (!this.isValidEmail(this.email)) {
        this.errorMsg = "邮箱格式无效";
        return;
      }
      if (this.mode === "login") {
        await this.doLogin();
      } else {
        if (this.password.length < 6) {
          this.errorMsg = "密码至少需要6位";
          return;
        }
        if (this.password !== this.confirmPassword) {
          this.errorMsg = "密码与确认密码不一致";
          return;
        }
        await this.doRegister();
      }
    },
    async doLogin() {
      common_vendor.index.showLoading({ title: "登录中，请稍后...", mask: true });
      try {
        const obj = common_vendor.tr.importObject("register", { customUI: true });
        const res = await obj.login(this.email.trim(), this.password);
        if (res.errCode === 0) {
          this.saveTokenAndUser(res.newToken, res.userInfo);
          this.$emit("close");
          const uid = res.userInfo && res.userInfo._id;
          if (uid) {
            common_vendor.tr.importObject("login", { customUI: true }).recordLoginTime(uid).catch(() => {
            });
          }
        } else {
          this.errorMsg = res.errMsg || (res.errCode === "USER_NOT_FOUND" ? "该邮箱尚未注册" : "登录失败");
        }
      } catch (e) {
        this.errorMsg = e.message || "网络异常，请重试";
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    async doRegister() {
      try {
        const obj = common_vendor.tr.importObject("register");
        const res = await obj.registerUser(this.email.trim(), this.password, this.nickname);
        if (res.errCode === 0) {
          this.saveTokenAndUser(res.newToken, res.userInfo);
          this.$emit("close");
        } else {
          this.errorMsg = res.errMsg || (res.errCode === "EMAIL_EXISTS" ? "该邮箱已注册" : "注册失败");
        }
      } catch (e) {
        this.errorMsg = e.message || "网络异常，请重试";
      }
    },
    saveTokenAndUser(newToken, userInfo) {
      if (newToken && newToken.token) {
        common_vendor.index.setStorageSync("uni_id_token", newToken.token);
        if (newToken.tokenExpired != null) {
          common_vendor.index.setStorageSync("uni_id_token_expired", newToken.tokenExpired);
        }
      }
      const u = userInfo || {};
      store_index.mutations.setUser({ _id: u._id, email: u.email || this.email, nickname: u.nickname || this.nickname });
    },
    getStoredUsers() {
      try {
        const v = common_vendor.index.getStorageSync("users");
        return v ? JSON.parse(v) : [];
      } catch (e) {
        return [];
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.onClose && $options.onClose(...args)),
    b: common_vendor.t($data.mode === "login" ? "登录" : "注册"),
    c: $data.mode === "login" ? 1 : "",
    d: common_vendor.o(($event) => {
      $data.mode = "login";
      $options.clearError();
    }),
    e: $data.mode === "register" ? 1 : "",
    f: common_vendor.o(($event) => {
      $data.mode = "register";
      $options.clearError();
    }),
    g: $data.errorMsg
  }, $data.errorMsg ? {
    h: common_vendor.t($data.errorMsg)
  } : {}, {
    i: $data.email,
    j: common_vendor.o(($event) => $data.email = $event.detail.value),
    k: $data.password,
    l: common_vendor.o(($event) => $data.password = $event.detail.value),
    m: $data.mode === "register"
  }, $data.mode === "register" ? common_vendor.e({
    n: $data.confirmPassword,
    o: common_vendor.o(($event) => $data.confirmPassword = $event.detail.value),
    p: $options.confirmPasswordMismatch
  }, $options.confirmPasswordMismatch ? {} : {}, {
    q: $data.nickname,
    r: common_vendor.o(($event) => $data.nickname = $event.detail.value)
  }) : {}, {
    s: common_vendor.t($data.mode === "login" ? "登录" : "注册"),
    t: !$options.canSubmit ? 1 : "",
    v: common_vendor.o((...args) => $options.onSubmit && $options.onSubmit(...args)),
    w: common_vendor.o(() => {
    }),
    x: common_vendor.o((...args) => $options.onClose && $options.onClose(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5a44606c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/LoginRegisterSheet.js.map
