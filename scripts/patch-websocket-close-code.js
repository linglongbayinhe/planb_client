/**
 * 修复 uni-app 开发模式「日志回显」WebSocket 关闭码不合法导致的微信小程序报错：
 * closeSocket:fail ... The code must be either 1000, or between 3000 and 4999. 1006 is neither.
 *
 * 说明：源码不在本仓库，位于 HBuilderX/uni-app 编译链生成的 vendor 中。
 * 每次「运行到小程序」后若需日志回显且出现上述报错，运行本脚本修补生成的 vendor.js。
 * 用法：node scripts/patch-websocket-close-code.js
 */

const fs = require('fs');
const path = require('path');

const vendorPath = path.join(
  __dirname,
  '..',
  'unpackage',
  'dist',
  'dev',
  'mp-weixin',
  'common',
  'vendor.js'
);

if (!fs.existsSync(vendorPath)) {
  console.warn('[patch-websocket] vendor.js 不存在，请先运行项目到微信小程序再执行本脚本。路径:', vendorPath);
  process.exit(0);
}

let content = fs.readFileSync(vendorPath, 'utf8');
const before = content;
content = content.replace(/\bcode:\s*1006\b/g, 'code: 1000');

if (content === before) {
  console.log('[patch-websocket] 未发现 code: 1006，可能已修复或版本已更新。');
  process.exit(0);
}

fs.writeFileSync(vendorPath, content, 'utf8');
console.log('[patch-websocket] 已把 WebSocket close 的 code 从 1006 改为 1000，文件已保存。');
