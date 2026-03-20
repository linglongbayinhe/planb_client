"use strict";
const common_vendor = require("../../common/vendor.js");
const store_index = require("../../store/index.js");
const EditClueSheet = () => "./EditClueSheet.js";
const _sfc_main = {
  name: "ClueDetailSheet",
  components: { EditClueSheet },
  props: {
    clue: {
      type: Object,
      required: true
    }
  },
  emits: ["close", "updated", "deleted"],
  data() {
    return {
      showEditSheet: false,
      currentClue: { ...this.clue }
    };
  },
  computed: {
    typeLabel() {
      const map = { important: "重要物品", digital: "数字资产", family: "给家人的话" };
      return map[this.currentClue.type] || "未知";
    },
    typeColor() {
      const map = { important: "#FF9500", digital: "#007AFF", family: "#34C759" };
      return map[this.currentClue.type] || "#8E8E93";
    },
    typeEmoji() {
      const map = { important: "📦", digital: "🔑", family: "💌" };
      return map[this.currentClue.type] || "📋";
    },
    mainTitle() {
      if (this.currentClue.type === "important")
        return this.currentClue.name || "未命名";
      if (this.currentClue.type === "digital")
        return this.currentClue.platform || "未命名";
      if (this.currentClue.type === "family")
        return this.currentClue.title || "未命名";
      return "未命名";
    },
    formattedUpdatedAt() {
      if (!this.currentClue.updatedAt)
        return "未知";
      const d = new Date(this.currentClue.updatedAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      return `${year}年${month}月${day}日 ${h12}:${mins} ${ampm}`;
    }
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    openEditSheet() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      this.showEditSheet = true;
    },
    onEditSaved(updated) {
      this.currentClue = { ...updated };
      this.showEditSheet = false;
      this.$emit("updated", this.currentClue);
    },
    confirmDelete() {
      if (!store_index.mutations.ensureAuthForWriteAction())
        return;
      common_vendor.index.showModal({
        title: "删除这条线索？",
        content: "此操作不可撤销",
        confirmColor: "#FF3B30",
        confirmText: "删除",
        success: (res) => {
          if (res.confirm) {
            const deleted = store_index.mutations.deleteClue(this.currentClue.id);
            if (!deleted)
              return;
            this.$emit("deleted");
          }
        }
      });
    }
  }
};
if (!Array) {
  const _component_EditClueSheet = common_vendor.resolveComponent("EditClueSheet");
  _component_EditClueSheet();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.openEditSheet && $options.openEditSheet(...args), "bc"),
    b: common_vendor.o((...args) => $options.onClose && $options.onClose(...args), "61"),
    c: common_vendor.t($options.typeEmoji),
    d: common_vendor.t($options.typeLabel),
    e: $options.typeColor,
    f: $options.typeColor + "22",
    g: common_vendor.t($options.mainTitle),
    h: $props.clue.type === "important"
  }, $props.clue.type === "important" ? common_vendor.e({
    i: $props.clue.location
  }, $props.clue.location ? {
    j: common_vendor.t($props.clue.location)
  } : {}, {
    k: $props.clue.location && $props.clue.relation
  }, $props.clue.location && $props.clue.relation ? {} : {}, {
    l: $props.clue.relation
  }, $props.clue.relation ? {
    m: common_vendor.t($props.clue.relation)
  } : {}, {
    n: ($props.clue.location || $props.clue.relation) && $props.clue.note
  }, ($props.clue.location || $props.clue.relation) && $props.clue.note ? {} : {}, {
    o: $props.clue.note
  }, $props.clue.note ? {
    p: common_vendor.t("\n"),
    q: common_vendor.t($props.clue.note)
  } : {}) : {}, {
    r: $props.clue.type === "digital"
  }, $props.clue.type === "digital" ? common_vendor.e({
    s: $props.clue.account
  }, $props.clue.account ? {
    t: common_vendor.t($props.clue.account)
  } : {}, {
    v: $props.clue.account && $props.clue.relation
  }, $props.clue.account && $props.clue.relation ? {} : {}, {
    w: $props.clue.relation
  }, $props.clue.relation ? {
    x: common_vendor.t($props.clue.relation)
  } : {}, {
    y: ($props.clue.account || $props.clue.relation) && $props.clue.note
  }, ($props.clue.account || $props.clue.relation) && $props.clue.note ? {} : {}, {
    z: $props.clue.note
  }, $props.clue.note ? {
    A: common_vendor.t("\n"),
    B: common_vendor.t($props.clue.note)
  } : {}) : {}, {
    C: $props.clue.type === "family"
  }, $props.clue.type === "family" ? common_vendor.e({
    D: $props.clue.target
  }, $props.clue.target ? {
    E: common_vendor.t($props.clue.target)
  } : {}, {
    F: $props.clue.target && $props.clue.background
  }, $props.clue.target && $props.clue.background ? {} : {}, {
    G: $props.clue.background
  }, $props.clue.background ? {
    H: common_vendor.t($props.clue.background)
  } : {}, {
    I: ($props.clue.target || $props.clue.background) && $props.clue.note
  }, ($props.clue.target || $props.clue.background) && $props.clue.note ? {} : {}, {
    J: $props.clue.note
  }, $props.clue.note ? {
    K: common_vendor.t($props.clue.note)
  } : {}) : {}, {
    L: common_vendor.t($options.formattedUpdatedAt),
    M: common_vendor.o((...args) => $options.confirmDelete && $options.confirmDelete(...args), "0c"),
    N: common_vendor.o(() => {
    }, "b2"),
    O: $data.showEditSheet
  }, $data.showEditSheet ? {
    P: common_vendor.o(($event) => $data.showEditSheet = false, "54"),
    Q: common_vendor.o($options.onEditSaved, "35"),
    R: common_vendor.p({
      clue: $data.currentClue
    })
  } : {}, {
    S: common_vendor.o((...args) => $options.onClose && $options.onClose(...args), "45")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-866cb5f9"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/sheets/ClueDetailSheet.js.map
