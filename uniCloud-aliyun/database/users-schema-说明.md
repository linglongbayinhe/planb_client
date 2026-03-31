# users.schema.json 说明

## 当前状态

`users.schema.json` 已不再是当前项目的主业务表结构。

当前项目实际使用的是：

- 用户主表：`uni-id-users`
- 任务队列表：`plan_send_tasks`

因此，`users.schema.json` 现在只保留为历史备份参考，不作为当前功能开发、部署或排障的主要依据。

## 什么时候还会用到

只有在以下情况，才需要回看 `users.schema.json`：

- 需要追溯旧版本字段设计
- 需要对比历史 `users` 表与当前 `uni-id-users` 的差异
- 需要从旧备份数据恢复部分字段

## 当前不再适用的内容

下面这些迁移过程说明，当前都不再作为项目实施依据：

- `users` 作为主业务表的写法
- 基于 `users` 的权限与 clientDB 设计说明
- 迁移期间的临时兼容策略
- 围绕 `users` 表的旧自测步骤

## 当前应参考的文件

- 当前用户主表结构：`uniCloud-aliyun/database/uni-id-users.schema.json`
- 当前任务表结构：`uniCloud-aliyun/database/plan_send_tasks.schema.json`
- 当前任务表说明：`uniCloud-aliyun/database/plan_send_tasks-schema-说明.md`

## 结论

`users.schema.json` 可以继续留在仓库里作为备份，但不应再被视为当前项目的正式数据库结构说明。
