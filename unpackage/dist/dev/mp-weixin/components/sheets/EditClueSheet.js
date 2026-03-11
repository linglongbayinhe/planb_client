"use strict";
const store_index = require("../../store/index.js");
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "EditClueSheet",
  props: {
    clue: {
      type: Object,
      required: true
    }
  },
  emits: ["close", "saved"],
  data() {
    return {
      form: {
        name: this.clue.name || "",
        location: this.clue.location || "",
        relation: this.clue.relation || "",
        note: this.clue.note || "",
        platform: this.clue.platform || "",
        account: this.clue.account || "",
        title: this.clue.title || "",
        target: this.clue.target || "",
        background: this.clue.background || ""
      }
    };
  },
  computed: {
    typeLabel() {
      const map = { important: "重要物品", digital: "数字资产", family: "给家人的话" };
      return map[this.clue.type] || "未知";
    },
    typeColor() {
      const map = { important: "#FF9500", digital: "#007AFF", family: "#34C759" };
      return map[this.clue.type] || "#8E8E93";
    },
    canSave() {
      if (this.clue.type === "important")
        return !!this.form.name.trim();
      if (this.clue.type === "digital")
        return !!this.form.platform.trim();
      if (this.clue.type === "family")
        return !!this.form.title.trim();
      return false;
    }
  },
  methods: {
    onCancel() {
      this.$emit("close");
    },
    onSave() {
      if (!this.canSave)
        return;
      const updates = { ...this.form };
      store_index.mutations.updateClue(this.clue.id, updates);
      const updated = { ...this.clue, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      this.$emit("saved", updated);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.onCancel && $options.onCancel(...args)),
    b: !$options.canSave ? 1 : "",
    c: !$options.canSave ? 1 : "",
    d: common_vendor.o((...args) => $options.onSave && $options.onSave(...args)),
    e: common_vendor.t($options.typeLabel),
    f: $options.typeColor,
    g: $options.typeColor + "22",
    h: $props.clue.type === "important"
  }, $props.clue.type === "important" ? {
    i: $data.form.name,
    j: common_vendor.o(($event) => $data.form.name = $event.detail.value),
    k: $data.form.location,
    l: common_vendor.o(($event) => $data.form.location = $event.detail.value),
    m: $data.form.relation,
    n: common_vendor.o(($event) => $data.form.relation = $event.detail.value)
  } : {}, {
    o: $props.clue.type === "important"
  }, $props.clue.type === "important" ? {
    p: $data.form.note,
    q: common_vendor.o(($event) => $data.form.note = $event.detail.value)
  } : {}, {
    r: $props.clue.type === "digital"
  }, $props.clue.type === "digital" ? {
    s: $data.form.platform,
    t: common_vendor.o(($event) => $data.form.platform = $event.detail.value),
    v: $data.form.account,
    w: common_vendor.o(($event) => $data.form.account = $event.detail.value),
    x: $data.form.relation,
    y: common_vendor.o(($event) => $data.form.relation = $event.detail.value)
  } : {}, {
    z: $props.clue.type === "digital"
  }, $props.clue.type === "digital" ? {
    A: $data.form.note,
    B: common_vendor.o(($event) => $data.form.note = $event.detail.value)
  } : {}, {
    C: $props.clue.type === "family"
  }, $props.clue.type === "family" ? {
    D: $data.form.title,
    E: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    F: $data.form.target,
    G: common_vendor.o(($event) => $data.form.target = $event.detail.value),
    H: $data.form.background,
    I: common_vendor.o(($event) => $data.form.background = $event.detail.value)
  } : {}, {
    J: $props.clue.type === "family"
  }, $props.clue.type === "family" ? {
    K: $data.form.note,
    L: common_vendor.o(($event) => $data.form.note = $event.detail.value)
  } : {}, {
    M: common_vendor.o(() => {
    }),
    N: common_vendor.o((...args) => $options.onCancel && $options.onCancel(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dd9903cc"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/EditClueSheet.js.map
