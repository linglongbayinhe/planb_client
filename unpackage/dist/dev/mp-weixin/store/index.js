"use strict";
const common_vendor = require("../common/vendor.js");
const defaultPlan = {
  enabled: false,
  sendDate: null,
  intervalDays: 7,
  emails: [],
  phones: [],
  displayName: "",
  customGuide: ""
};
function loadJSON(key, fallback) {
  try {
    const v = common_vendor.index.getStorageSync(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
function loadStr(key, fallback) {
  try {
    const v = common_vendor.index.getStorageSync(key);
    return v || fallback;
  } catch (e) {
    return fallback;
  }
}
const defaultCategoryOrder = ["digital", "important", "family"];
const store = common_vendor.reactive({
  clues: loadJSON("clues", []),
  sendPlan: Object.assign({}, defaultPlan, loadJSON("plan", {})),
  currentUser: loadJSON("user", null),
  theme: loadStr("theme", "minimal"),
  language: loadStr("language", "zh-CN"),
  categoryOrder: loadJSON("clueCategoryOrder", defaultCategoryOrder)
});
const mutations = {
  addClue(clue) {
    const newClue = Object.assign({}, clue, {
      id: Date.now().toString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    store.clues = [newClue, ...store.clues];
    common_vendor.index.setStorageSync("clues", JSON.stringify(store.clues));
  },
  updateClue(id, data) {
    store.clues = store.clues.map(
      (c) => c.id === id ? Object.assign({}, c, data, {
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }) : c
    );
    common_vendor.index.setStorageSync("clues", JSON.stringify(store.clues));
  },
  deleteClue(id) {
    store.clues = store.clues.filter((c) => c.id !== id);
    common_vendor.index.setStorageSync("clues", JSON.stringify(store.clues));
  },
  updateSendPlan(data) {
    store.sendPlan = Object.assign({}, store.sendPlan, data);
    common_vendor.index.setStorageSync("plan", JSON.stringify(store.sendPlan));
  },
  setUser(user) {
    store.currentUser = user;
    common_vendor.index.setStorageSync("user", JSON.stringify(user));
  },
  logout() {
    store.currentUser = null;
    common_vendor.index.removeStorageSync("user");
  },
  setTheme(theme) {
    store.theme = theme;
    common_vendor.index.setStorageSync("theme", theme);
  },
  setLanguage(lang) {
    store.language = lang;
    common_vendor.index.setStorageSync("language", lang);
  },
  setCategoryOrder(order) {
    store.categoryOrder = order;
    common_vendor.index.setStorageSync("clueCategoryOrder", JSON.stringify(order));
  },
  resetAll() {
    store.clues = [];
    store.sendPlan = Object.assign({}, defaultPlan);
    store.currentUser = null;
    store.categoryOrder = defaultCategoryOrder;
    common_vendor.index.removeStorageSync("clues");
    common_vendor.index.removeStorageSync("plan");
    common_vendor.index.removeStorageSync("user");
    common_vendor.index.removeStorageSync("clueCategoryOrder");
  }
};
exports.mutations = mutations;
exports.store = store;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/index.js.map
