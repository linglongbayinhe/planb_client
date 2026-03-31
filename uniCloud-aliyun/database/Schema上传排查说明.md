# Schema 上传排查说明

## 适用范围

本文用于排查 `uniCloud-aliyun/database/` 目录下数据库 schema 或索引上传失败的问题，适用于当前项目仍在使用的文件，例如：

- `uni-id-users.schema.json`
- `plan_send_tasks.schema.json`
- `users.schema.json`（仅备份参考）
- `users.index.json`
- `plan_send_tasks.index.json`

## 当前项目现状

- 当前业务主表为 `uni-id-users`
- 发送任务队列表为 `plan_send_tasks`
- `users.schema.json` 仅作为历史备份参考，不再作为当前业务主表

## 上传前检查

1. 确认文件已保存为 UTF-8 编码，内容不是乱码。
2. 确认当前 HBuilderX 连接的是正确的阿里云服务空间。
3. 确认上传的是 `schema.json` 或 `index.json` 本身，而不是说明文档。
4. 确认 JSON 语法合法，没有多余逗号、注释或非法引号。

## 本地快速校验

在项目根目录执行：

```bash
node -e "try { JSON.parse(require('fs').readFileSync('uniCloud-aliyun/database/plan_send_tasks.schema.json','utf8')); console.log('JSON 合法'); } catch(e) { console.log('错误:', e.message); }"
```

如果要检查其他 schema，把文件名替换掉即可。

## 常见失败原因

### 1. JSON 格式错误

常见表现：

- 上传直接失败
- 控制台只显示 `undefined`
- HBuilderX 没给出明确字段错误

处理方式：

- 先做本地 `JSON.parse`
- 再检查是否含注释、尾逗号、半角/全角引号混用

### 2. 字段类型与配置不匹配

例如：

- `trim` 只适用于 `bsonType: "string"`
- `defaultValue` 的类型要与字段类型一致
- `enum` 的值要与字段实际类型一致

### 3. 引用未准备好

如果 schema 中使用了 `foreignKey`、依赖其他集合或扩展库，但云空间中对应资源尚未准备好，可能导致上传失败。

当前项目里：

- `plan_send_tasks.schema.json` 没有外键依赖，上传风险较低
- `uni-id-users.schema.json` 如果后续继续调整，要特别注意字段类型和扩展表依赖

### 4. 上传错服务空间

同一个项目如果绑定了多个服务空间，最容易出现“本地改对了，但云端没变化”的情况。

处理方式：

- 上传前先确认 HBuilderX 左下角/顶部当前选中的服务空间
- 上传后到 DCloud 控制台检查对应云空间的表结构是否变化

## 推荐上传顺序

如果本次改动同时包含 schema、索引、云函数：

1. 先上传数据库 schema
2. 再上传数据库 index
3. 最后上传依赖这些表结构的云函数/云对象

对于当前任务队列方案，推荐顺序是：

1. `plan_send_tasks.schema.json`
2. `plan_send_tasks.index.json`
3. `send_plan`
4. `plan_send_check`

## 当前项目的重点检查项

### `plan_send_tasks`

上传后确认：

- 集合 `plan_send_tasks` 已创建
- 索引 `status_next_retry_at` 已存在
- 索引字段顺序为 `status -> next_retry_at`

### `uni-id-users`

上传后确认：

- 表结构仍能正常读取
- 不影响现有登录、用户资料、发送计划等功能

## 上传后建议验证

1. 到 DCloud 控制台确认集合和索引已生效。
2. 手动运行一次 `plan_send_check` 的 `dryRun`。
3. 查看返回结果和日志，确认没有 schema 不匹配导致的运行时报错。

## 结论

如果 schema 上传失败，优先按下面顺序排查：

1. JSON 语法
2. 字段类型与配置是否匹配
3. 当前服务空间是否正确
4. 依赖集合/索引是否先于云函数部署
