"use strict";
const store_index = require("../../store/index.js");
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "AddClueSheet",
  props: {
    initialType: {
      type: String,
      default: "important"
    }
  },
  emits: ["close", "saved"],
  data() {
    return {
      selectedType: this.initialType || "important",
      form: {
        name: "",
        location: "",
        relation: "",
        note: "",
        platform: "",
        account: "",
        title: "",
        target: "",
        background: ""
      },
      types: [
        { key: "important", label: "重要物品" },
        { key: "digital", label: "数字资产" },
        { key: "family", label: "给家人的话" }
      ]
    };
  },
  computed: {
    canSave() {
      if (this.selectedType === "important")
        return !!this.form.name.trim();
      if (this.selectedType === "digital")
        return !!this.form.platform.trim();
      if (this.selectedType === "family")
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
      const clue = { type: this.selectedType };
      if (this.selectedType === "important") {
        Object.assign(clue, {
          name: this.form.name,
          location: this.form.location,
          relation: this.form.relation,
          note: this.form.note
        });
      } else if (this.selectedType === "digital") {
        Object.assign(clue, {
          platform: this.form.platform,
          account: this.form.account,
          relation: this.form.relation,
          note: this.form.note
        });
      } else if (this.selectedType === "family") {
        Object.assign(clue, {
          title: this.form.title,
          target: this.form.target,
          background: this.form.background,
          note: this.form.note
        });
      }
      store_index.mutations.addClue(clue);
      this.$emit("saved");
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.onCancel && $options.onCancel(...args)),
    b: !$options.canSave ? 1 : "",
    c: !$options.canSave ? 1 : "",
    d: common_vendor.o((...args) => $options.onSave && $options.onSave(...args)),
    e: common_vendor.f($data.types, (t, k0, i0) => {
      return {
        a: common_vendor.t(t.label),
        b: $data.selectedType === t.key ? 1 : "",
        c: t.key,
        d: $data.selectedType === t.key ? 1 : "",
        e: common_vendor.o(($event) => $data.selectedType = t.key, t.key)
      };
    }),
    f: $data.selectedType === "important"
  }, $data.selectedType === "important" ? {
    g: $data.form.name,
    h: common_vendor.o(($event) => $data.form.name = $event.detail.value),
    i: $data.form.location,
    j: common_vendor.o(($event) => $data.form.location = $event.detail.value),
    k: $data.form.relation,
    l: common_vendor.o(($event) => $data.form.relation = $event.detail.value)
  } : {}, {
    m: $data.selectedType === "important"
  }, $data.selectedType === "important" ? {
    n: $data.form.note,
    o: common_vendor.o(($event) => $data.form.note = $event.detail.value)
  } : {}, {
    p: $data.selectedType === "digital"
  }, $data.selectedType === "digital" ? {
    q: $data.form.platform,
    r: common_vendor.o(($event) => $data.form.platform = $event.detail.value),
    s: $data.form.account,
    t: common_vendor.o(($event) => $data.form.account = $event.detail.value),
    v: $data.form.relation,
    w: common_vendor.o(($event) => $data.form.relation = $event.detail.value)
  } : {}, {
    x: $data.selectedType === "digital"
  }, $data.selectedType === "digital" ? {
    y: $data.form.note,
    z: common_vendor.o(($event) => $data.form.note = $event.detail.value)
  } : {}, {
    A: $data.selectedType === "family"
  }, $data.selectedType === "family" ? {
    B: $data.form.title,
    C: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    D: $data.form.target,
    E: common_vendor.o(($event) => $data.form.target = $event.detail.value),
    F: $data.form.background,
    G: common_vendor.o(($event) => $data.form.background = $event.detail.value)
  } : {}, {
    H: $data.selectedType === "family"
  }, $data.selectedType === "family" ? {
    I: $data.form.note,
    J: common_vendor.o(($event) => $data.form.note = $event.detail.value)
  } : {}, {
    K: common_vendor.o((...args) => $options.onCancel && $options.onCancel(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4f4b4649"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/AddClueSheet.js.map
