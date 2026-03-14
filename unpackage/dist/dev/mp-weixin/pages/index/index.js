"use strict";
const common_vendor = require("../../common/vendor.js");
const HomeView = () => "../../components/HomeView.js";
const CluesView = () => "../../components/CluesView.js";
const SendView = () => "../../components/SendView.js";
const SettingsView = () => "../../components/SettingsView.js";
const _sfc_main = {
  components: {
    HomeView,
    CluesView,
    SendView,
    SettingsView
  },
  data() {
    return {
      currentTab: 0,
      safeAreaBottom: 0,
      // Tab 图标须用 PNG（微信小程序 image 用 SVG 易导致启动报错 [] [object Object]）
      // 若已添加 home/clues/send/settings 的 png，可改为对应路径；否则先用 play/pause 占位
      tabs: [
        { label: "首页", icon: "/static/icons/home.png", iconActive: "/static/icons/home-active.png" },
        { label: "线索库", icon: "/static/icons/clues.png", iconActive: "/static/icons/clues-active.png" },
        { label: "发送", icon: "/static/icons/send.png", iconActive: "/static/icons/send-active.png" },
        { label: "设置", icon: "/static/icons/settings.png", iconActive: "/static/icons/settings-active.png" }
      ]
    };
  },
  onLoad() {
    try {
      const info = typeof common_vendor.index.getWindowInfo === "function" ? common_vendor.index.getWindowInfo() : null;
      this.safeAreaBottom = info && info.safeAreaInsets && info.safeAreaInsets.bottom || 0;
    } catch (e) {
      this.safeAreaBottom = 0;
    }
  },
  methods: {
    switchTab(index) {
      this.currentTab = index;
    }
  }
};
if (!Array) {
  const _component_HomeView = common_vendor.resolveComponent("HomeView");
  const _component_CluesView = common_vendor.resolveComponent("CluesView");
  const _component_SendView = common_vendor.resolveComponent("SendView");
  const _component_SettingsView = common_vendor.resolveComponent("SettingsView");
  (_component_HomeView + _component_CluesView + _component_SendView + _component_SettingsView)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.currentTab === 0,
    b: common_vendor.o($options.switchTab),
    c: $data.currentTab === 1,
    d: $data.currentTab === 2,
    e: $data.currentTab === 3,
    f: common_vendor.f($data.tabs, (tab, i, i0) => {
      return {
        a: $data.currentTab === i ? tab.iconActive : tab.icon,
        b: common_vendor.t(tab.label),
        c: $data.currentTab === i ? 1 : "",
        d: i,
        e: $data.currentTab === i ? 1 : "",
        f: common_vendor.o(($event) => $options.switchTab(i), i)
      };
    }),
    g: $data.safeAreaBottom + "px"
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
