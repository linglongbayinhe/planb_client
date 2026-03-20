"use strict";
const common_vendor = require("../common/vendor.js");
const store_index = require("../store/index.js");
const LoginRegisterSheet = () => "./sheets/LoginRegisterSheet.js";
const ThemePickerSheet = () => "./sheets/ThemePickerSheet.js";
const LanguagePickerSheet = () => "./sheets/LanguagePickerSheet.js";
const THEME_LABELS = {
  minimal: "极简风格",
  nightlight: "夜航灯塔"
};
const LANGUAGE_LABELS = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "en": "English",
  "ja": "日本語",
  "ko": "한국어"
};
const _sfc_main = {
  name: "SettingsView",
  components: {
    LoginRegisterSheet,
    ThemePickerSheet,
    LanguagePickerSheet
  },
  data() {
    return {
      statusBarHeight: 44,
      showLoginSheet: false,
      showThemePicker: false,
      showLanguagePicker: false
    };
  },
  computed: {
    currentUser() {
      return store_index.store.currentUser;
    },
    themeLabel() {
      return THEME_LABELS[store_index.store.theme] || "极简风格";
    },
    languageLabel() {
      return LANGUAGE_LABELS[store_index.store.language] || "简体中文";
    }
  },
  mounted() {
    try {
      const info = typeof common_vendor.index.getWindowInfo === "function" ? common_vendor.index.getWindowInfo() : null;
      this.statusBarHeight = info && info.statusBarHeight || 44;
    } catch (e) {
      this.statusBarHeight = 44;
    }
    if (typeof common_vendor.index !== "undefined" && typeof common_vendor.index.$on === "function") {
      common_vendor.index.$on("open-login-sheet", this.openLoginSheet);
    }
  },
  beforeDestroy() {
    if (typeof common_vendor.index !== "undefined" && typeof common_vendor.index.$off === "function") {
      common_vendor.index.$off("open-login-sheet", this.openLoginSheet);
    }
  },
  methods: {
    openLoginSheet() {
      this.showLoginSheet = true;
    },
    onAccountTap() {
      if (!this.currentUser) {
        this.openLoginSheet();
      }
    },
    confirmLogout() {
      common_vendor.index.showModal({
        title: "退出登录",
        content: "确定要退出当前账号吗？",
        confirmColor: "#FF3B30",
        success: (res) => {
          if (res.confirm) {
            store_index.mutations.logout();
          }
        }
      });
    },
    confirmReset() {
      if (!this.currentUser) {
        this.openLoginSheet();
        return;
      }
      common_vendor.index.showModal({
        title: "重置并删除本地数据",
        content: "此操作将清除所有线索和发送计划，不可恢复。确定继续？",
        confirmColor: "#FF3B30",
        confirmText: "删除",
        success: (res) => {
          if (res.confirm) {
            store_index.mutations.resetAll();
          }
        }
      });
    }
  }
};
if (!Array) {
  const _component_LoginRegisterSheet = common_vendor.resolveComponent("LoginRegisterSheet");
  const _component_ThemePickerSheet = common_vendor.resolveComponent("ThemePickerSheet");
  const _component_LanguagePickerSheet = common_vendor.resolveComponent("LanguagePickerSheet");
  (_component_LoginRegisterSheet + _component_ThemePickerSheet + _component_LanguagePickerSheet)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $options.currentUser && $options.currentUser.avatar
  }, $options.currentUser && $options.currentUser.avatar ? {
    c: $options.currentUser.avatar
  } : {}, {
    d: $options.currentUser
  }, $options.currentUser ? {
    e: common_vendor.t($options.currentUser.nickname || $options.currentUser.email || "已登录")
  } : {}, {
    f: $options.currentUser && $options.currentUser.email
  }, $options.currentUser && $options.currentUser.email ? {
    g: common_vendor.t($options.currentUser.email)
  } : {}, {
    h: $options.currentUser && !$options.currentUser.email
  }, $options.currentUser && !$options.currentUser.email ? {} : {}, {
    i: !$options.currentUser
  }, !$options.currentUser ? {} : {}, {
    j: !$options.currentUser
  }, !$options.currentUser ? {} : {}, {
    k: $options.currentUser
  }, $options.currentUser ? {
    l: common_vendor.o((...args) => $options.confirmLogout && $options.confirmLogout(...args), "6a")
  } : {}, {
    m: common_vendor.o((...args) => $options.onAccountTap && $options.onAccountTap(...args), "fe"),
    n: common_vendor.t($options.themeLabel),
    o: common_vendor.o(($event) => $data.showThemePicker = true, "58"),
    p: common_vendor.t($options.languageLabel),
    q: common_vendor.o(($event) => $data.showLanguagePicker = true, "f4"),
    r: common_vendor.o((...args) => $options.confirmReset && $options.confirmReset(...args), "24"),
    s: $data.showLoginSheet
  }, $data.showLoginSheet ? {
    t: common_vendor.o(($event) => $data.showLoginSheet = false, "d3")
  } : {}, {
    v: $data.showThemePicker
  }, $data.showThemePicker ? {
    w: common_vendor.o(($event) => $data.showThemePicker = false, "2d")
  } : {}, {
    x: $data.showLanguagePicker
  }, $data.showLanguagePicker ? {
    y: common_vendor.o(($event) => $data.showLanguagePicker = false, "af")
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c1020a98"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/SettingsView.js.map
