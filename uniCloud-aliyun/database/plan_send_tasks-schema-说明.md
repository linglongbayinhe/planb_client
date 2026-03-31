# plan_send_tasks.schema.json 说明

## 表用途

`plan_send_tasks` 是当前发送计划方案里的轻量任务表，用来承接 `plan_send_check` 的实际执行对象。

它的目标是：

- 不再让 `plan_send_check` 直接扫描 `uni-id-users`
- 把待发送任务提前整理成小表
- 让定时函数只处理“到期任务”
- 降低云函数查询量、执行时长和 RU 消耗

## 一条记录代表什么

一条文档代表“某个用户在某个发送渠道上的一个活动任务”。

当前按渠道拆分，所以同一用户最多保留两条活动任务：

- `uid:email`
- `uid:sms`

其中 `_id` 使用确定性格式 `uid:channel`，便于直接覆盖更新和按主键读取。

## 字段说明

| 字段 | 类型 | 含义 | 作用 |
|---|---|---|---|
| `_id` | string | 任务主键，格式为 `uid:channel` | 保证每个用户每个渠道只保留一条活动任务，便于 upsert 和直接查询 |
| `uid` | string | 用户 ID | 用来关联 `uni-id-users` 中的用户 |
| `channel` | string | 发送渠道，当前只允许 `email` 或 `sms` | 区分邮件任务和短信任务 |
| `status` | string | 任务状态 | 用于表示任务当前是否待执行、执行中、待重试、成功或最终失败 |
| `due_at` | long | 原始计划发送时间，毫秒时间戳 | 记录任务最初对应的用户 `send_time`，用于完成后清空 `send_time` 的乐观锁判断 |
| `next_retry_at` | long | 下一次可执行时间，毫秒时间戳 | worker 用它判断任务是否到期可执行，也用于重试调度 |
| `attempt_count` | int | 已尝试次数 | 控制任务当前已经发送过几次 |
| `max_attempts` | int | 最大尝试次数 | 达到上限后任务进入 `failed`，不再继续重试 |
| `recipients` | array | 收件人快照 | 保存当前任务的接收目标，邮件是邮箱数组，短信是手机号数组 |
| `display_name` | string | 展示姓名快照 | 发送内容里需要使用的展示名，避免执行时再回表读取 |
| `message` | string | 通知正文快照 | 发送时直接使用的正文内容快照 |
| `template_data` | object | 短信模板变量快照 | 如果短信模板需要变量，可直接从任务里读取 |
| `lock_token` | string | 任务锁标识 | worker 抢到任务后写入，用于防止多实例重复执行 |
| `lock_expire_at` | long | 任务锁过期时间，毫秒时间戳 | 锁超时后允许其他 worker 重新抢占，防止死锁 |
| `last_error` | string | 最近一次失败原因 | 方便排查任务重试或失败原因 |
| `last_sent_at` | long | 最近一次发送成功时间，毫秒时间戳 | 用来记录成功发送时间 |
| `updated_at` | long | 文档最近更新时间，毫秒时间戳 | 用于审计和排查任务状态变化 |

## status 字段取值

| 状态值 | 含义 | 说明 |
|---|---|---|
| `pending` | 待执行 | 新任务或首次待发送任务 |
| `processing` | 执行中 | 已被某个 worker 抢到，正在执行 |
| `retry` | 待重试 | 上次发送失败，等待下次重试 |
| `success` | 成功 | 已成功发送完成 |
| `failed` | 最终失败 | 已达到最大重试次数，不再重试 |

## 为什么要存快照字段

`recipients`、`display_name`、`message`、`template_data` 这些字段都属于发送所需的快照。

这样设计的好处是：

- `plan_send_check` 执行时不需要每条任务都回查 `uni-id-users`
- 可以显著减少读库次数
- 更符合“任务队列”模型

## 锁字段的意义

`lock_token` 和 `lock_expire_at` 一起构成任务锁。

它们的作用是：

- 避免两个 worker 同时处理同一条任务
- 支持通过 CAS 更新实现“谁抢到锁谁执行”
- 某次执行中断后，锁过期后任务还能重新被处理

## 时间字段为什么都用毫秒时间戳

当前 schema 里 `due_at`、`next_retry_at`、`lock_expire_at`、`last_sent_at`、`updated_at` 都使用 `long`。

这样做的原因是：

- 便于直接比较大小
- 便于按时间范围查询
- 适合当前任务调度和重试逻辑

## 索引配套

`plan_send_tasks` 必须配合索引文件一起使用：

- `uniCloud-aliyun/database/plan_send_tasks.index.json`

当前关键索引是：

- `status_next_retry_at`

索引字段顺序是：

1. `status`
2. `next_retry_at`

它的作用是支撑这类查询：

- `status in ['pending', 'retry']`
- `next_retry_at <= now`

如果没有这个索引，`plan_send_check` 的任务扫描效率会明显变差。

## 当前方案中的角色

在当前项目里，`plan_send_tasks` 的职责是：

- `send_plan` 负责同步生成或删除任务
- `plan_send_check` 负责消费这些任务
- `uni-id-users` 继续作为用户主表

也就是说：

- 用户配置存放在 `uni-id-users`
- 待执行任务存放在 `plan_send_tasks`

## 结论

`plan_send_tasks` 不是用户资料表，而是发送计划的执行队列表。它的设计重点不是“存完整用户信息”，而是“用最小字段集支撑定时发送和重试”，从而尽量降低云函数资源消耗。
