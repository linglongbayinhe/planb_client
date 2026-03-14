# 小程序 WebSocket 关闭码 1006 报错说明

## 报错现象

```
closeSocket:fail Failed to execute 'close' on 'WebSocket': 
The code must be either 1000, or between 3000 and 4999. 1006 is neither.
```

## 原因

- 来自 **uni-app 开发模式「日志回显」** 功能：用 WebSocket 把小程序里的 `console` 打到 HBuilderX 控制台。
- 连接超时时，框架调用了 `socket.close({ code: 1006, reason: "connect timeout" })`。
- 微信规定：主动关闭 WebSocket 时 **code 只能是 1000 或 3000–4999**；**1006 为保留码**，不能由业务/框架在 `close` 时传入。

## 源码位置（不在本仓库）

- 这段逻辑的**源码不在当前项目里**，而是由 **HBuilderX / uni-app 编译链** 在构建时打进 `unpackage/dist/dev/mp-weixin/common/vendor.js`。
- 对应实现一般在 **@dcloudio 或 uni-app 相关 npm 包**（由 HBuilderX 或 CLI 使用的运行时），本仓库未包含这些依赖的源码，因此无法在项目内直接改“源码”。

## 本仓库的修复方式

- 使用 **构建后修补**：在「运行到小程序」生成 `vendor.js` 之后，用脚本把其中的 `code: 1006` 改成合法值 `code: 1000`。
- 脚本：`scripts/patch-websocket-close-code.js`  
- 用法：在项目根目录执行  
  `node scripts/patch-websocket-close-code.js`  
  建议在每次「运行到微信小程序」并需要开日志回显时执行一次（若仍出现 1006 报错再执行即可）。

## 升级时要注意什么

1. **HBuilderX / uni-app 升级后**  
   - 若官方已修复（改为使用 1000 或 3000–4999），可不再运行本脚本。  
   - 若升级后仍报 1006，继续在运行到小程序后执行一次 `node scripts/patch-websocket-close-code.js` 即可。

2. **不想用修补脚本时**  
   - 可在 HBuilderX 控制台右上角**关闭「日志回显」**，并重新运行小程序，则不会建立该 WebSocket，也不会触发此报错。

3. **不要直接改 unpackage 下的 vendor.js 并提交**  
   - `unpackage/dist` 为编译产物，每次运行都会覆盖，修改会丢失；修复应通过上述脚本在本地执行。
