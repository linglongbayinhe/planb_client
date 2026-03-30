# uni-id-users 与 users 双表结合方案说明

> **现状**：项目已采用**方案 A 单表合并**，业务统一读写 `uni-id-users` 表，已移除 `ensure-user-profile` 及双表逻辑。下文为**方案 B（双表懒加载）**的历史说明，仅供参考。

## 概述

当使用 **uni-id-co** 进行登录时，用户数据会写入 `uni-id-users` 表；而业务逻辑（发送计划、邮箱/手机号配置等）依赖 `users` 表。本方案通过**懒加载同步**实现两表协同。

## 方案 B：双表懒加载同步（已实现）

### 数据流

```
登录(uni-id-co) → uni-id-users
                    ↓
业务请求(带 token) → ensureUserProfile(uid)
                    ↓
            若 users 无记录 → 从 uni-id-users 拷贝创建 users 记录
                    ↓
            业务读写 users 表
```

### 实现

- **公共模块**：`cloudfunctions/common/ensure-user-profile/`
  - `ensureUserProfile(db, uid)`：确保 `users` 表存在 uid 对应记录；若不存在且 `uni-id-users` 中有，则创建默认记录并返回。
- **已集成云对象**：user_profile、send_plan（兼容期旧的 send_email / send_phone / send_message / send_time / set_enable_sending 仍保留）

### 使用场景

- **当前**：项目使用 auth_provider 直接写 users 表，ensureUserProfile 仅在第一级检查即命中 users，无额外开销。
- **若未来接入 uni-id-co（如仅微信登录）**：登录写入 uni-id-users，业务首次访问时自动在 users 创建对应记录，无需改表结构。

### 依赖

各云对象需在 package.json 中声明：

```json
"dependencies": {
  "ensure-user-profile": "file:../common/ensure-user-profile"
}
```

并执行 `npm install` 建立链接。上传云函数时，HBuilderX 会一并打包公共模块。

## 其他方案（未采用）

- **方案 A 单表合并**：将 users 业务字段并入 uni-id-users，需迁移数据。
- **方案 C 注册钩子**：依赖 uni-id-co 的 afterRegister 等钩子，官方支持有限。
- **方案 D 显式同步**：登录后前端调用同步接口，多一次请求。

详见计划文档：`uni-id 选型与 uni-id-users / users 双表结合方案`。
