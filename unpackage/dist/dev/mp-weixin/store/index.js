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
function normalizeTokenExpired(raw) {
  const n = Number(raw);
  if (!n || !isFinite(n))
    return 0;
  return n < 1e12 ? n * 1e3 : n;
}
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
  setSendPlanFromCloud(payload) {
    const p = payload || {};
    const safeInterval = Number(store.sendPlan && store.sendPlan.intervalDays) || defaultPlan.intervalDays;
    store.sendPlan = Object.assign({}, defaultPlan, {
      intervalDays: safeInterval,
      enabled: !!p.enabled,
      sendDate: p.sendDate || null,
      emails: Array.isArray(p.emails) ? p.emails : [],
      phones: Array.isArray(p.phones) ? p.phones : [],
      displayName: p.displayName || "",
      customGuide: p.customGuide || ""
    });
    common_vendor.index.setStorageSync("plan", JSON.stringify(store.sendPlan));
  },
  applyUserBootstrap(payload) {
    const user = payload && payload.user ? payload.user : null;
    const plan = payload && payload.plan ? payload.plan : {};
    this.setUser(user);
    this.setSendPlanFromCloud(plan);
  },
  setUser(user) {
    store.currentUser = user;
    common_vendor.index.setStorageSync("user", JSON.stringify(user));
  },
  saveAuthToken(newToken) {
    const token = newToken && newToken.token;
    const tokenExpired = normalizeTokenExpired(newToken && newToken.tokenExpired);
    if (!token)
      return;
    common_vendor.index.setStorageSync("uni_id_token", token);
    if (tokenExpired > 0) {
      common_vendor.index.setStorageSync("uni_id_token_expired", tokenExpired);
    }
  },
  getStoredTokenInfo() {
    try {
      const token = common_vendor.index.getStorageSync("uni_id_token") || "";
      const tokenExpiredRaw = common_vendor.index.getStorageSync("uni_id_token_expired");
      const tokenExpired = normalizeTokenExpired(tokenExpiredRaw);
      return { token, tokenExpired };
    } catch (e) {
      return { token: "", tokenExpired: 0 };
    }
  },
  hasValidSession() {
    const tokenInfo = this.getStoredTokenInfo();
    if (!tokenInfo.token)
      return false;
    if (!tokenInfo.tokenExpired)
      return true;
    return Date.now() < tokenInfo.tokenExpired;
  },
  clearAuthSession() {
    store.currentUser = null;
    common_vendor.index.removeStorageSync("user");
    common_vendor.index.removeStorageSync("uni_id_token");
    common_vendor.index.removeStorageSync("uni_id_token_expired");
  },
  logout() {
    this.clearAuthSession();
    common_vendor.index.removeStorageSync("users");
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
    common_vendor.index.removeStorageSync("uni_id_token");
    common_vendor.index.removeStorageSync("uni_id_token_expired");
    common_vendor.index.removeStorageSync("users");
  }
};
exports.mutations = mutations;
exports.store = store;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/index.js.map
