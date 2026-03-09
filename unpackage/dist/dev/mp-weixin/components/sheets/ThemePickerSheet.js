"use strict";
const common_vendor = require("../../common/vendor.js");
const store_index = require("../../store/index.js");
const _sfc_main = {
  name: "ThemePickerSheet",
  emits: ["close"],
  data() {
    return {
      previewDays: 29,
      themes: [
        {
          key: "minimal",
          name: "极简风格",
          desc: "简洁明快，清爽自然",
          icon: "✦",
          iconBg: "#F0EBFF"
        },
        {
          key: "nightlight",
          name: "夜航灯塔",
          desc: "深蓝主调，沉稳可信",
          icon: "🔦",
          iconBg: "#E8F0FF"
        }
      ]
    };
  },
  computed: {
    currentTheme() {
      return store_index.store.theme;
    }
  },
  methods: {
    selectTheme(key) {
      store_index.mutations.setTheme(key);
      common_vendor.index.vibrateShort && common_vendor.index.vibrateShort({ type: "light" });
    },
    onClose() {
      this.$emit("close");
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.onClose && $options.onClose(...args)),
    b: common_vendor.f($data.themes, (theme, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.n("preview-btn-" + theme.key),
        b: common_vendor.n("time-block-" + theme.key),
        c: common_vendor.n("time-block-" + theme.key),
        d: common_vendor.n("preview-" + theme.key),
        e: common_vendor.t(theme.icon),
        f: theme.iconBg,
        g: common_vendor.t(theme.name),
        h: common_vendor.t(theme.desc),
        i: $options.currentTheme === theme.key
      }, $options.currentTheme === theme.key ? {} : {}, {
        j: theme.key,
        k: $options.currentTheme === theme.key ? 1 : "",
        l: common_vendor.o(($event) => $options.selectTheme(theme.key), theme.key)
      });
    }),
    c: common_vendor.t($data.previewDays),
    d: common_vendor.o((...args) => $options.onClose && $options.onClose(...args))
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e57b6ea5"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/ThemePickerSheet.js.map
