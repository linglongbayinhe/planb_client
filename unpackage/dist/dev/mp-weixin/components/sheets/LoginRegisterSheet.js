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
    }
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    clearError() {
      this.errorMsg = "";
    },
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    onSubmit() {
      if (!this.canSubmit)
        return;
      this.errorMsg = "";
      if (!this.isValidEmail(this.email)) {
        this.errorMsg = "邮箱格式无效";
        return;
      }
      if (this.mode === "login") {
        const users = this.getStoredUsers();
        const user = users.find((u) => u.email === this.email);
        if (!user) {
          this.errorMsg = "该邮箱尚未注册";
          return;
        }
        if (user.password !== this.password) {
          this.errorMsg = "密码不正确";
          return;
        }
        store_index.mutations.setUser({ email: user.email, nickname: user.nickname });
        this.$emit("close");
      } else {
        if (this.password.length < 6) {
          this.errorMsg = "密码至少需要6位";
          return;
        }
        if (this.password !== this.confirmPassword) {
          this.errorMsg = "两次密码不一致";
          return;
        }
        const users = this.getStoredUsers();
        if (users.find((u) => u.email === this.email)) {
          this.errorMsg = "该邮箱已注册";
          return;
        }
        const newUser = {
          email: this.email,
          password: this.password,
          nickname: this.nickname
        };
        users.push(newUser);
        try {
          common_vendor.index.setStorageSync("users", JSON.stringify(users));
        } catch (e) {
        }
        store_index.mutations.setUser({ email: newUser.email, nickname: newUser.nickname });
        this.$emit("close");
      }
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
  }, $data.mode === "register" ? {
    n: $data.confirmPassword,
    o: common_vendor.o(($event) => $data.confirmPassword = $event.detail.value),
    p: $data.nickname,
    q: common_vendor.o(($event) => $data.nickname = $event.detail.value)
  } : {}, {
    r: common_vendor.t($data.mode === "login" ? "登录" : "注册"),
    s: !$options.canSubmit ? 1 : "",
    t: common_vendor.o((...args) => $options.onSubmit && $options.onSubmit(...args)),
    v: common_vendor.o((...args) => $options.onClose && $options.onClose(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5a44606c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/LoginRegisterSheet.js.map
