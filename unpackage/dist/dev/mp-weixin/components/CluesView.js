"use strict";
const common_vendor = require("../common/vendor.js");
const store_index = require("../store/index.js");
const AddClueSheet = () => "./sheets/AddClueSheet.js";
const ExportPDFSheet = () => "./sheets/ExportPDFSheet.js";
const ClueDetailSheet = () => "./sheets/ClueDetailSheet.js";
const _sfc_main = {
  name: "CluesView",
  components: {
    AddClueSheet,
    ExportPDFSheet,
    ClueDetailSheet
  },
  data() {
    return {
      statusBarHeight: 44,
      searchText: "",
      currentCategory: "all",
      showAddSheet: false,
      showExportSheet: false,
      showDetailSheet: false,
      selectedClue: null,
      categories: [
        { key: "all", label: "全部" },
        { key: "digital", label: "数字资产" },
        { key: "important", label: "重要物品" },
        { key: "family", label: "给家人的话" }
      ]
    };
  },
  computed: {
    filteredClues() {
      let list = store_index.store.clues;
      if (this.currentCategory !== "all") {
        list = list.filter((c) => c.type === this.currentCategory);
      }
      if (this.searchText.trim()) {
        const q = this.searchText.trim().toLowerCase();
        list = list.filter((c) => {
          const vals = Object.values(c).join(" ").toLowerCase();
          return vals.includes(q);
        });
      }
      return list;
    }
  },
  mounted() {
    common_vendor.index.getSystemInfo({
      success: (info) => {
        this.statusBarHeight = info.statusBarHeight || 44;
      }
    });
  },
  methods: {
    onSearch() {
    },
    clearSearch() {
      this.searchText = "";
    },
    openAddSheet() {
      this.showAddSheet = true;
    },
    openExportSheet() {
      this.showExportSheet = true;
    },
    openDetailSheet(clue) {
      this.selectedClue = clue;
      this.showDetailSheet = true;
    },
    onClueSaved() {
      this.showAddSheet = false;
    },
    onClueUpdated(updated) {
      this.selectedClue = updated;
    },
    onClueDeleted() {
      this.showDetailSheet = false;
      this.selectedClue = null;
    },
    clueTitle(clue) {
      if (clue.type === "important")
        return clue.name || "未命名";
      if (clue.type === "digital")
        return clue.platform || "未命名";
      if (clue.type === "family")
        return clue.title || "未命名";
      return "未命名";
    },
    clueSubtitle1(clue) {
      if (clue.type === "important" && clue.location)
        return `存放：${clue.location}`;
      if (clue.type === "digital" && clue.account)
        return `账号：${clue.account}`;
      if (clue.type === "family" && clue.target)
        return `对象：${clue.target}`;
      return "";
    },
    clueSubtitle2(clue) {
      if (clue.relation)
        return `关联：${clue.relation}`;
      if (clue.type === "family" && clue.background)
        return `背景：${clue.background}`;
      return "";
    },
    clueSubtitle3(clue) {
      if (clue.type !== "family" && clue.note)
        return `备注：${clue.note}`;
      return "";
    },
    clueIconBg(type) {
      if (type === "important")
        return "#FF9500";
      if (type === "digital")
        return "#007AFF";
      if (type === "family")
        return "#34C759";
      return "#8E8E93";
    },
    clueIconEmoji(type) {
      if (type === "important")
        return "📦";
      if (type === "digital")
        return "🔑";
      if (type === "family")
        return "💌";
      return "📋";
    }
  }
};
if (!Array) {
  const _component_AddClueSheet = common_vendor.resolveComponent("AddClueSheet");
  const _component_ExportPDFSheet = common_vendor.resolveComponent("ExportPDFSheet");
  const _component_ClueDetailSheet = common_vendor.resolveComponent("ClueDetailSheet");
  (_component_AddClueSheet + _component_ExportPDFSheet + _component_ClueDetailSheet)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.openAddSheet && $options.openAddSheet(...args)),
    c: common_vendor.o([($event) => $data.searchText = $event.detail.value, (...args) => $options.onSearch && $options.onSearch(...args)]),
    d: $data.searchText,
    e: $data.searchText
  }, $data.searchText ? {
    f: common_vendor.o((...args) => $options.clearSearch && $options.clearSearch(...args))
  } : {}, {
    g: common_vendor.f($data.categories, (cat, i, i0) => {
      return {
        a: common_vendor.t(cat.label),
        b: $data.currentCategory === cat.key ? 1 : "",
        c: i,
        d: $data.currentCategory === cat.key ? 1 : "",
        e: common_vendor.o(($event) => $data.currentCategory = cat.key, i)
      };
    }),
    h: common_vendor.o((...args) => $options.openExportSheet && $options.openExportSheet(...args)),
    i: common_vendor.t($options.filteredClues.length),
    j: $options.filteredClues.length === 0
  }, $options.filteredClues.length === 0 ? {
    k: common_vendor.t("\n"),
    l: common_vendor.o((...args) => $options.openAddSheet && $options.openAddSheet(...args))
  } : {
    m: common_vendor.f($options.filteredClues, (clue, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t($options.clueIconEmoji(clue.type)),
        b: $options.clueIconBg(clue.type),
        c: common_vendor.t($options.clueTitle(clue)),
        d: $options.clueSubtitle1(clue)
      }, $options.clueSubtitle1(clue) ? {
        e: common_vendor.t($options.clueSubtitle1(clue))
      } : {}, {
        f: $options.clueSubtitle2(clue)
      }, $options.clueSubtitle2(clue) ? {
        g: common_vendor.t($options.clueSubtitle2(clue))
      } : {}, {
        h: $options.clueSubtitle3(clue)
      }, $options.clueSubtitle3(clue) ? {
        i: common_vendor.t($options.clueSubtitle3(clue))
      } : {}, {
        j: clue.id,
        k: common_vendor.o(($event) => $options.openDetailSheet(clue), clue.id)
      });
    })
  }, {
    n: $data.showAddSheet
  }, $data.showAddSheet ? {
    o: common_vendor.o(($event) => $data.showAddSheet = false),
    p: common_vendor.o($options.onClueSaved),
    q: common_vendor.p({
      ["initial-type"]: $data.currentCategory !== "all" ? $data.currentCategory : "important"
    })
  } : {}, {
    r: $data.showExportSheet
  }, $data.showExportSheet ? {
    s: common_vendor.o(($event) => $data.showExportSheet = false)
  } : {}, {
    t: $data.showDetailSheet && $data.selectedClue
  }, $data.showDetailSheet && $data.selectedClue ? {
    v: common_vendor.o(($event) => {
      $data.showDetailSheet = false;
      $data.selectedClue = null;
    }),
    w: common_vendor.o($options.onClueUpdated),
    x: common_vendor.o($options.onClueDeleted),
    y: common_vendor.p({
      clue: $data.selectedClue
    })
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-cac9647b"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/CluesView.js.map
