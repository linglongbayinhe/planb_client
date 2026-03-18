"use strict";
const common_vendor = require("../../common/vendor.js");
const store_index = require("../../store/index.js");
const _sfc_main = {
  name: "LanguagePickerSheet",
  emits: ["close"],
  data() {
    return {
      languages: [
        { key: "zh-CN", name: "简体中文", nameEn: "Simplified Chinese", flag: "🇨🇳" },
        { key: "zh-TW", name: "繁體中文", nameEn: "Traditional Chinese", flag: "🇹🇼" },
        { key: "en", name: "English", nameEn: "English", flag: "🇺🇸" },
        { key: "ja", name: "日本語", nameEn: "Japanese", flag: "🇯🇵" },
        { key: "ko", name: "한국어", nameEn: "Korean", flag: "🇰🇷" }
      ]
    };
  },
  computed: {
    currentLanguage() {
      return store_index.store.language;
    }
  },
  methods: {
    selectLanguage(key) {
      store_index.mutations.setLanguage(key);
      common_vendor.index.vibrateShort && common_vendor.index.vibrateShort({ type: "light" });
      setTimeout(() => {
        this.$emit("close");
      }, 300);
    },
    onClose() {
      this.$emit("close");
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.onClose && $options.onClose(...args), "4e"),
    b: common_vendor.f($data.languages, (lang, i, i0) => {
      return common_vendor.e({
        a: common_vendor.t(lang.flag),
        b: common_vendor.t(lang.name),
        c: common_vendor.t(lang.nameEn),
        d: $options.currentLanguage === lang.key
      }, $options.currentLanguage === lang.key ? {} : {}, {
        e: common_vendor.o(($event) => $options.selectLanguage(lang.key), lang.key),
        f: i < $data.languages.length - 1
      }, i < $data.languages.length - 1 ? {} : {}, {
        g: lang.key
      });
    }),
    c: common_vendor.o((...args) => $options.onClose && $options.onClose(...args), "f1")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-3687e129"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/LanguagePickerSheet.js.map
