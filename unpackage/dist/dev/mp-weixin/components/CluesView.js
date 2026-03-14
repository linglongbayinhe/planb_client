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
      filterScrollLeft: 0,
      dragState: {
        active: false,
        movableIndex: -1,
        dropIndex: -1
      },
      dragOffsetPx: 0,
      dragReleasePhase: false,
      _longPressTimer: null,
      _touchStartX: 0,
      _lastMoveX: 0,
      _chipWidth: 90,
      _categoryLabelMap: {
        all: "全部",
        digital: "数字资产",
        important: "重要物品",
        family: "给家人的话"
      }
    };
  },
  computed: {
    categories() {
      const order = store_index.store.categoryOrder || ["digital", "important", "family"];
      return [
        { key: "all", label: this._categoryLabelMap.all },
        ...order.map((k) => ({ key: k, label: this._categoryLabelMap[k] || k }))
      ];
    },
    displayCategories() {
      if (!this.dragState.active || this.dragState.movableIndex < 0) {
        return this.categories;
      }
      const movable = this.categories.slice(1);
      const from = this.dragState.movableIndex;
      const to = this.dragState.dropIndex;
      if (from === to)
        return this.categories;
      const arr = movable.slice();
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return [{ key: "all", label: this._categoryLabelMap.all }, ...arr];
    },
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
      const order = store_index.store.categoryOrder || ["digital", "important", "family"];
      const typeOrder = (type) => {
        const i = order.indexOf(type);
        return i === -1 ? 999 : i;
      };
      return list.slice().sort((a, b) => {
        const o = typeOrder(a.type) - typeOrder(b.type);
        if (o !== 0)
          return o;
        return (new Date(b.updatedAt) || 0) - (new Date(a.updatedAt) || 0);
      });
    }
  },
  mounted() {
    try {
      const info = typeof common_vendor.index.getWindowInfo === "function" ? common_vendor.index.getWindowInfo() : null;
      this.statusBarHeight = info && info.statusBarHeight || 44;
    } catch (e) {
      this.statusBarHeight = 44;
    }
  },
  methods: {
    getDragChipStyle(i) {
      if (!this.dragState.active || i !== this.dragState.dropIndex + 1)
        return {};
      const px = this.dragOffsetPx || 0;
      return { transform: "translateX(" + px + "px) scale(1.05)" };
    },
    onFilterScroll(e) {
      this.filterScrollLeft = e.detail.scrollLeft;
    },
    onFilterChipClick(i) {
      if (this.dragState.active)
        return;
      this.currentCategory = this.displayCategories[i].key;
    },
    onTagTouchStart(e, i) {
      if (i === 0)
        return;
      const movableIndex = i - 1;
      const touch = e.touches && e.touches[0];
      if (!touch)
        return;
      this._touchStartX = touch.clientX;
      this._lastMoveX = touch.clientX;
      if (this._longPressTimer)
        clearTimeout(this._longPressTimer);
      this._longPressTimer = setTimeout(() => {
        this._longPressTimer = null;
        this.dragOffsetPx = 0;
        this.dragReleasePhase = false;
        this._lastMoveX = this._touchStartX;
        this.dragState = { active: true, movableIndex, dropIndex: movableIndex };
      }, 320);
    },
    onFilterRowTouchMove(e) {
      if (this.dragState.active) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
      }
    },
    onTagTouchMove(e, i) {
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }
      if (!this.dragState.active)
        return;
      if (e.preventDefault)
        e.preventDefault();
      if (e.stopPropagation)
        e.stopPropagation();
      const touch = e.touches && e.touches[0];
      if (!touch)
        return;
      const clientX = touch.clientX;
      const delta = clientX - this._lastMoveX;
      this._lastMoveX = clientX;
      const chipWidth = this._chipWidth;
      let newOffset = this.dragOffsetPx + delta;
      let dropIndex = this.dragState.dropIndex;
      while (newOffset >= chipWidth / 2 && dropIndex < 2) {
        newOffset -= chipWidth;
        dropIndex++;
      }
      while (newOffset <= -chipWidth / 2 && dropIndex > 0) {
        newOffset += chipWidth;
        dropIndex--;
      }
      this.dragOffsetPx = newOffset;
      if (dropIndex !== this.dragState.dropIndex) {
        this.dragState = { ...this.dragState, dropIndex };
      }
    },
    onTagTouchEnd() {
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }
      if (!this.dragState.active)
        return;
      const { movableIndex, dropIndex } = this.dragState;
      const order = store_index.store.categoryOrder.slice();
      const [item] = order.splice(movableIndex, 1);
      order.splice(dropIndex, 0, item);
      this.dragReleasePhase = true;
      this.dragOffsetPx = 0;
      const self = this;
      setTimeout(function() {
        store_index.mutations.setCategoryOrder(order);
        self.dragState = { active: false, movableIndex: -1, dropIndex: -1 };
        self.dragReleasePhase = false;
      }, 220);
    },
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
    g: common_vendor.f($options.displayCategories, (cat, i, i0) => {
      return {
        a: common_vendor.t(cat.label),
        b: $data.currentCategory === cat.key && !$data.dragState.active ? 1 : "",
        c: cat.key,
        d: $data.currentCategory === cat.key && !$data.dragState.active ? 1 : "",
        e: $data.dragState.active && i === $data.dragState.dropIndex + 1 ? 1 : "",
        f: $data.dragReleasePhase && i === $data.dragState.dropIndex + 1 ? 1 : "",
        g: common_vendor.s($options.getDragChipStyle(i)),
        h: common_vendor.o(($event) => $options.onFilterChipClick(i), cat.key),
        i: common_vendor.o(($event) => $options.onTagTouchStart($event, i), cat.key),
        j: common_vendor.o(($event) => $options.onTagTouchMove($event, i), cat.key),
        k: common_vendor.o((...args) => $options.onTagTouchEnd && $options.onTagTouchEnd(...args), cat.key),
        l: common_vendor.o((...args) => $options.onTagTouchEnd && $options.onTagTouchEnd(...args), cat.key)
      };
    }),
    h: common_vendor.o((...args) => $options.onFilterRowTouchMove && $options.onFilterRowTouchMove(...args)),
    i: $data.filterScrollLeft,
    j: common_vendor.o((...args) => $options.onFilterScroll && $options.onFilterScroll(...args)),
    k: common_vendor.o((...args) => $options.openExportSheet && $options.openExportSheet(...args)),
    l: common_vendor.t($options.filteredClues.length),
    m: $options.filteredClues.length === 0
  }, $options.filteredClues.length === 0 ? {
    n: common_vendor.t("\n"),
    o: common_vendor.o((...args) => $options.openAddSheet && $options.openAddSheet(...args))
  } : {
    p: common_vendor.f($options.filteredClues, (clue, k0, i0) => {
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
    q: $data.showAddSheet
  }, $data.showAddSheet ? {
    r: common_vendor.o(($event) => $data.showAddSheet = false),
    s: common_vendor.o($options.onClueSaved),
    t: common_vendor.p({
      ["initial-type"]: $data.currentCategory !== "all" ? $data.currentCategory : "important"
    })
  } : {}, {
    v: $data.showExportSheet
  }, $data.showExportSheet ? {
    w: common_vendor.o(($event) => $data.showExportSheet = false)
  } : {}, {
    x: $data.showDetailSheet && $data.selectedClue
  }, $data.showDetailSheet && $data.selectedClue ? {
    y: common_vendor.o(($event) => {
      $data.showDetailSheet = false;
      $data.selectedClue = null;
    }),
    z: common_vendor.o($options.onClueUpdated),
    A: common_vendor.o($options.onClueDeleted),
    B: common_vendor.p({
      clue: $data.selectedClue
    })
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-cac9647b"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/CluesView.js.map
