"use strict";
const common_vendor = require("../../common/vendor.js");
const store_index = require("../../store/index.js");
const _sfc_main = {
  name: "ExportPDFSheet",
  emits: ["close"],
  data() {
    return {
      fileName: "线索手册",
      usePassword: false,
      password: "",
      confirmPassword: "",
      passwordHint: "",
      typeLabels: {
        important: "重要物品",
        digital: "数字资产",
        family: "给家人的话"
      }
    };
  },
  computed: {
    totalClues() {
      return store_index.store.clues.length;
    },
    typeStats() {
      const stats = { important: 0, digital: 0, family: 0 };
      store_index.store.clues.forEach((c) => {
        if (stats[c.type] !== void 0)
          stats[c.type]++;
      });
      return stats;
    },
    canExport() {
      if (this.totalClues === 0)
        return false;
      if (this.usePassword) {
        return this.password.length > 0 && this.password === this.confirmPassword;
      }
      return true;
    }
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    doExport() {
      if (!this.canExport)
        return;
      common_vendor.index.showToast({
        title: "导出功能即将上线",
        icon: "none",
        duration: 2e3
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.onClose && $options.onClose(...args)),
    b: $data.fileName,
    c: common_vendor.o(($event) => $data.fileName = $event.detail.value),
    d: common_vendor.t($data.fileName || "线索手册"),
    e: common_vendor.t($options.totalClues),
    f: common_vendor.f($options.typeStats, (count, type, i0) => {
      return common_vendor.e({
        a: count > 0
      }, count > 0 ? {
        b: common_vendor.t($data.typeLabels[type]),
        c: common_vendor.t(count),
        d: count > 0 ? 1 : ""
      } : {}, {
        e: type
      });
    }),
    g: $data.usePassword,
    h: common_vendor.o(($event) => $data.usePassword = $event.detail.value),
    i: $data.usePassword
  }, $data.usePassword ? {
    j: $data.password,
    k: common_vendor.o(($event) => $data.password = $event.detail.value),
    l: $data.confirmPassword,
    m: common_vendor.o(($event) => $data.confirmPassword = $event.detail.value),
    n: $data.passwordHint,
    o: common_vendor.o(($event) => $data.passwordHint = $event.detail.value)
  } : {}, {
    p: !$options.canExport ? 1 : "",
    q: common_vendor.o((...args) => $options.doExport && $options.doExport(...args)),
    r: common_vendor.o((...args) => $options.onClose && $options.onClose(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-25171861"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/ExportPDFSheet.js.map
