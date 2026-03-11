# users.schema.json 上传失败（返回 undefined）排查说明

## 一、已修复的问题

### inviter_uid 字段：trim 仅对 string 有效

- **原因**：官方文档明确说明 `trim` 仅当 `bsonType="string"` 时有效。  
- **原状**：`inviter_uid` 的 `bsonType` 为 `array`，却配置了 `"trim": "both"`，属于非法组合，阿里云服务端校验可能因此失败并只返回 undefined。  
- **修改**：已从 `inviter_uid` 上移除 `trim`，只保留 `bsonType` 与 `description`。

请先**保存文件后再次上传** users.schema.json（右键 schema 文件 → 上传 DB Schema，或 Ctrl+u）。

---

## 二、若仍失败，可逐项排查

### 1. 本地校验 JSON 格式

在项目根目录执行（PowerShell 或 命令提示符）：

```bash
node -e "try { JSON.parse(require('fs').readFileSync('uniCloud-aliyun/database/users.schema.json','utf8')); console.log('JSON 合法'); } catch(e) { console.log('错误:', e.message); }"
```

输出为「JSON 合法」即语法无误。若报错，按提示修正（常见：多余逗号、注释、非 UTF-8 编码或 BOM）。

### 2. 分段上传测试（缩小范围）

若整表上传仍返回 undefined，可先做「最小可上传版本」测试：

1. **备份**当前 `users.schema.json`。  
2. **新建**一个临时 schema（如 `users_mini.schema.json`），内容仅保留：

```json
{
	"bsonType": "object",
	"required": [],
	"properties": {
		"_id": { "description": "ID" },
		"email": { "bsonType": "string", "title": "邮箱" }
	},
	"version": "0.0.1"
}
```

3. 上传该临时 schema：  
   - 若**能成功**，说明当前环境、网络、权限正常，问题在完整 schema 的某一类配置；  
   - 若**仍失败**，则更可能是环境/网络/控制台权限或 HBuilderX 版本问题。

### 3. 可能触发服务端异常的配置（若修复 trim 后仍失败可尝试）

- **foreignKey / enum 引用其他表**  
  当前 schema 中有：  
  `d_ids` → opendb-department、`role` → uni-id-roles、`dcloud_appid` → opendb-app-list。  
  若云空间里**没有**这些集合，部分环境下上传可能失败。可**临时**去掉这些字段的 `foreignKey`、`enum`（或整段字段）再上传，确认是否与「引用不存在表」有关。

- **表级 permission 表达式**  
  表级使用了 `"read": "doc._id == auth.uid"` 等表达式。理论上符合文档，若怀疑兼容性，可暂时改为 `"read": false` 测试上传是否通过。

- **bsonType: "password"**  
  文档中 password 为合法类型；若仅改上述仍失败，可临时将 `password` 改为 `"bsonType": "string"` 测试（仅作排查，不建议长期使用）。

### 4. 查看更详细错误信息

- **HBuilderX**：菜单「帮助」→「查看运行日志」或「开发者工具」，看是否有与 uniCloud / 阿里云相关的报错。  
- **uniCloud 控制台**：登录 [unicloud.dcloud.net.cn](https://unicloud.dcloud.net.cn) → 选择阿里云服务空间 → 云数据库 → 对应表 → 「表结构」：若之前有部分写入，可对比与本地 schema 的差异。  
- **网络**：上传约 20 秒后失败，可能是请求超时；可换网络或稍后再试。

### 5. 上传方式再确认

- 右键 `users.schema.json` → **上传 DB Schema**（或选中后 **Ctrl+u**）。  
- 确认顶部选中的是**当前使用的阿里云服务空间**（如 yy-planb），避免传到错误空间。

---

## 三、修改小结

| 项目           | 说明 |
|----------------|------|
| 已修改         | 删除 `inviter_uid` 的 `"trim": "both"`（array 类型不支持 trim） |
| JSON 语法      | 已用 Node 校验，当前文件合法 |
| 建议下一步     | 保存后重新上传；若仍失败，按第二节逐项缩小范围并查看日志 |

按上述修改并重新上传后，若仍出现「undefined」或新报错，可把**完整报错信息或截图**和**当前 users.schema.json 内容**贴出，便于继续排查。
