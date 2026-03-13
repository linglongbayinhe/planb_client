# users 表 Schema 更新说明与依赖检查

## 一、本次修改摘要

### 1. 新增业务字段（基于 uni-id-users 模板）

| 字段 | 类型 | 说明 | 校验规则 |
|------|------|------|----------|
| `send_emails` | array | 发送邮箱列表，最多 3 个 | `maxItems: 3`，元素 `format: "email"` |
| `send_phones` | array | 发送手机号列表，最多 3 个 | `maxItems: 3`，元素 `pattern: ^\+?[0-9-]{3,20}$`（与 mobile 一致） |
| `enable_sending` | bool | 是否开启发送计划 | `defaultValue: false` |
| `send_message` | string | 发送说明/消息 | `maxLength: 500`，`trim: "both"` |

### 2. 表级权限（permission）

- **read**：`doc._id == auth.uid` — 仅允许读取当前登录用户自己的文档。
- **update**：`doc._id == auth.uid` — 仅允许更新当前登录用户自己的文档。
- **create**：`false` — 禁止客户端直接创建用户（注册由云函数/uni-id 完成）。
- **delete**：`false` — 禁止客户端删除用户文档。

说明：**仅对 JQL / clientDB 生效**；云函数内使用 `db.collection('users').doc(uid).set/update()` 等传统 MongoDB API 不受 schema 权限限制。

### 3. 敏感字段字段级权限

- **password**：`write: false` — 禁止客户端直接改密码（应由 uni-id 的修改密码接口处理）。
- **token**：`read: false, write: false` — 禁止客户端读写 token，避免泄露或篡改。

---

## 二、字段与功能核对结果

### 内置字段完整性

- 已保留 uni-id-users 常用字段：`_id`、`username`、`password`、`email`、`mobile`、`status`、`role`、`token`、`nickname`、`avatar`、`created_time`、`last_login_time`、各第三方 openid、`identities` 等，类型与模板一致。
- `required` 仍为空数组，注册/登录由 uni-id 在云函数内校验必填项，无需在 schema 里写死 required。

### 数据验证规则

- 新增业务字段校验不会误拦合法数据：
  - `send_emails`：元素为合法邮箱即可，最多 3 个。
  - `send_phones`：与 `mobile` 相同 pattern，支持国际格式与短号，最多 3 个。
  - `send_message`：任意字符串，最长 500 字，前后去空格。
- 若前端传入空数组 `[]` 或未传字段，schema 不会强制必填，不会导致正常写入失败。

### 权限与安全

- 表级权限保证：客户端通过 JQL/clientDB 只能读写「当前用户」对应文档（`doc._id == auth.uid`）。
- 云函数（如 `set_enable_sending`、uni-id 登录/注册）使用 MongoDB API，不经过 schema 权限，**登录、注册、token 管理、enable_sending 写入等均不受影响**。

---

## 三、依赖该表的用法与结论

| 功能 | 实现方式 | 是否受 schema 影响 | 结论 |
|------|----------|--------------------|------|
| 用户登录 | uni-id-co / uni-id-common | 云函数内读写 users，走 MongoDB API | 不受 schema 权限影响，可正常运行 |
| 用户注册 | uni-id-co 或自建云函数写 users | 同上 | 同上 |
| Token 管理 | uni-id 在云函数内写 `token` 等 | 同上 | 同上 |
| 设置 enable_sending | 云函数 `set_enable_sending` 使用 `db.collection('users').doc(uid).set({ enable_sending }, { merge: true })` | 同上 | 可正常写入 |
| 前端 clientDB 读/写本人资料 | JQL 或 clientDB 查/改当前用户文档 | 受表级 + 字段级 permission 约束 | 仅能读写本人文档；password/token 受字段级限制，业务字段可正常读写 |

说明：项目中 `LoginRegisterSheet.vue` 里的 `getStoredUsers()` / `uni.setStorageSync('users')` 是**本地缓存的用户列表**，与云数据库 `users` 表无直接读写关系；若后续改为从云数据库拉取/同步用户信息，需在「已登录」前提下用 clientDB/JQL 查询当前用户（`doc._id == auth.uid`），此时会受上述表级权限保护，行为符合预期。

---

## 四、其他文件是否需调整

- **云函数 `set_enable_sending`**：无需修改，继续使用 `db.collection('users').doc(uid).set({ enable_sending }, { merge: true })` 即可。
- **云函数 `register`**：当前为脚手架空实现。若使用 uni-id 统一注册，需依赖 uni-id-co 的注册接口或自建注册云函数写 `users` 表；写入走 MongoDB API，不受本次 schema 权限限制。
- **前端**：若通过 clientDB 读/写用户表（含 `send_emails`、`send_phones`、`enable_sending`、`send_message`），需在请求中携带 uni-id 登录态（token），且只能操作当前用户文档；无需因本次 schema 变更改业务逻辑，除非之前依赖「可读写他人文档」。

---

## 五、修复后的 schema 版本

- 已直接更新 `uniCloud-aliyun/database/users.schema.json`。
- 版本号已从 `1.0.3` 调整为 `1.0.4`。

无需再替换其他文件；如需还原或对比，可用 git 查看 `users.schema.json` 的 diff。

---

## 六、建议自测项

1. **登录 / 注册**：使用 uni-id-co 或现有登录方式，确认能正常登录、注册。
2. **设置 enable_sending**：调用云对象 `set_enable_sending`，在控制台查看 `users` 表该用户文档的 `enable_sending` 是否更新。
3. **clientDB 读本人**：已登录状态下用 JQL/clientDB 查询当前用户（如 `db.collection('users').doc(uid).get()` 或等价 JQL），确认能读到昵称、业务字段等，且**不包含** `token`、`password` 等敏感字段（若做了 field 过滤或依赖 schema 的 read 限制）。
4. **clientDB 写本人业务字段**：更新 `send_emails`、`send_phones`、`send_message`、`enable_sending` 等，确认不报权限错误且写入成功。

按上述项通过后，可认为「依赖 users 表的云数据库功能」在 schema 更新后均能正常运行。
