# uniCloud 云对象上传失败「[object Object]」排查指南

## 当前状态

- 云对象 `wechatLogin` 已就绪，客户端已改为调用 `wechatLogin`（原 `login_wechat` 已删除）
- 已移除 file 依赖与 symlink，已与 `send_time` 结构对齐
- 上传仍失败，需获取阿里云返回的**真实错误**才能继续排查

## 获取真实错误的方法（必做）

### 方法一：用 HBuilderX CLI 上传（推荐）

1. **找到 HBuilderX 安装目录**
   - 右键桌面/开始菜单的「HBuilderX」快捷方式 → 属性 → 查看「目标」或「起始位置」
   - 或常见路径：`C:\Program Files\HBuilderX`、`D:\HBuilderX`、`C:\HBuilderX`

2. **将该目录加入系统 PATH**
   - Win + R 输入 `sysdm.cpl` → 高级 → 环境变量
   - 在「用户变量」或「系统变量」的 Path 中新建一项，填入 HBuilderX 安装目录（如 `D:\HBuilderX`）
   - 确定保存，**关闭并重新打开**命令行窗口

3. **在项目根目录执行**
   ```bash
   node debug-cli-upload.js
   ```
   - 若找到 cli，会尝试上传 `wechatLogin` 并将完整输出写入 `debug-8a5b47.log`
   - 查看 `debug-8a5b47.log` 中 H12 或 CLI 相关条目，即可看到阿里云返回的具体错误

### 方法二：在 DCloud 社区求助

- 打开 [DCloud 问答](https://ask.dcloud.net.cn/)
- 搜索「云对象上传失败」「upload failed object Object」
- 发帖时附上：HBuilderX 版本、uniCloud 服务商（阿里云）、项目结构、错误截图

### 方法三：检查 HBuilderX 版本与插件

- 部分版本存在 uniCloud 上传插件问题（如 4.84）
- 尝试：重启 HBuilderX → 再次右键上传
- 或更新到最新版 HBuilderX

## 环境检查清单

- [ ] uniCloud 目录已关联服务空间（右键 uniCloud-aliyun → 关联云服务空间）
- [ ] HBuilderX 已登录 DCloud 账号且未过期
- [ ] 网络可访问阿里云（防火墙/代理未拦截）
- [ ] 其他云对象（如 send_time）是否能成功上传？若全部失败则为环境问题
