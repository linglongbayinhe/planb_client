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
      validationError: "",
      formContentVisible: true,
      formBodyAnimate: false,
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
    onTypeChange(key) {
      if (key === this.selectedType)
        return;
      this.validationError = "";
      this.formContentVisible = false;
      this.formBodyAnimate = false;
      this.selectedType = key;
      this.resetForm();
      this.$nextTick(() => {
        setTimeout(() => {
          this.formContentVisible = true;
          this.formBodyAnimate = true;
        }, 40);
      });
    },
    resetForm() {
      this.form = {
        name: "",
        location: "",
        relation: "",
        note: "",
        platform: "",
        account: "",
        title: "",
        target: "",
        background: ""
      };
    },
    onSave() {
      if (!this.canSave) {
        if (this.selectedType === "important")
          this.validationError = "请填写名称";
        else if (this.selectedType === "digital")
          this.validationError = "请填写平台";
        else if (this.selectedType === "family")
          this.validationError = "请填写标题";
        return;
      }
      this.validationError = "";
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
    a: common_vendor.o((...args) => $options.onCancel && $options.onCancel(...args), "67"),
    b: !$options.canSave ? 1 : "",
    c: !$options.canSave ? 1 : "",
    d: common_vendor.o((...args) => $options.onSave && $options.onSave(...args), "98"),
    e: common_vendor.f($data.types, (t, k0, i0) => {
      return {
        a: common_vendor.t(t.label),
        b: $data.selectedType === t.key ? 1 : "",
        c: t.key,
        d: $data.selectedType === t.key ? 1 : "",
        e: common_vendor.o(($event) => $options.onTypeChange(t.key), t.key)
      };
    }),
    f: $data.validationError
  }, $data.validationError ? {
    g: common_vendor.t($data.validationError)
  } : {}, {
    h: common_vendor.o([($event) => $data.form.name = $event.detail.value, ($event) => $data.validationError = ""], "4a"),
    i: $data.form.name,
    j: $data.form.location,
    k: common_vendor.o(($event) => $data.form.location = $event.detail.value, "08"),
    l: $data.form.relation,
    m: common_vendor.o(($event) => $data.form.relation = $event.detail.value, "d9"),
    n: $data.selectedType === "important",
    o: $data.form.note,
    p: common_vendor.o(($event) => $data.form.note = $event.detail.value, "94"),
    q: $data.selectedType === "important",
    r: common_vendor.o([($event) => $data.form.platform = $event.detail.value, ($event) => $data.validationError = ""], "7a"),
    s: $data.form.platform,
    t: $data.form.account,
    v: common_vendor.o(($event) => $data.form.account = $event.detail.value, "ca"),
    w: $data.form.relation,
    x: common_vendor.o(($event) => $data.form.relation = $event.detail.value, "7b"),
    y: $data.selectedType === "digital",
    z: $data.form.note,
    A: common_vendor.o(($event) => $data.form.note = $event.detail.value, "a4"),
    B: $data.selectedType === "digital",
    C: common_vendor.o([($event) => $data.form.title = $event.detail.value, ($event) => $data.validationError = ""], "ee"),
    D: $data.form.title,
    E: $data.form.target,
    F: common_vendor.o(($event) => $data.form.target = $event.detail.value, "d1"),
    G: $data.form.background,
    H: common_vendor.o(($event) => $data.form.background = $event.detail.value, "10"),
    I: $data.selectedType === "family",
    J: $data.form.note,
    K: common_vendor.o(($event) => $data.form.note = $event.detail.value, "9c"),
    L: $data.selectedType === "family",
    M: $data.formContentVisible ? 1 : "",
    N: $data.formBodyAnimate ? 1 : "",
    O: common_vendor.o(() => {
    }, "fc"),
    P: common_vendor.o((...args) => $options.onCancel && $options.onCancel(...args), "0c")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4f4b4649"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/AddClueSheet.js.map
