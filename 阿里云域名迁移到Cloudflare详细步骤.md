# 阿里云域名迁移到 Cloudflare Workers 详细步骤

## 🎯 第一步：在 Cloudflare 添加域名

### 1.1 登录 Cloudflare
访问：https://dash.cloudflare.com/login

### 1.2 添加站点
1. 登录后，点击首页右上角的 **"添加站点"** (Add a Site) 按钮
2. 在输入框中输入：`alphaarena-live.com`（注意：不要加 www）
3. 点击蓝色的 **"添加站点"** (Add site) 按钮

### 1.3 选择免费计划
1. 页面会显示各种计划选项
2. 找到 **"Free"** 免费计划（$0/月）
3. 点击下方的 **"继续"** (Continue) 按钮

### 1.4 等待 DNS 扫描
1. Cloudflare 会自动扫描你现有的 DNS 记录
2. 显示 "正在扫描现有 DNS 记录..." (Querying existing DNS records)
3. 等待扫描完成（约 30 秒 - 2 分钟）

### 1.5 检查扫描到的 DNS 记录
1. 扫描完成后，会显示现有的 DNS 记录列表
2. **重要：不要修改这些记录**，保持原样即可
3. 直接点击底部的 **"继续"** (Continue) 按钮

---

## 🔧 第二步：在阿里云修改 Nameservers

### 2.1 获取 Cloudflare Nameservers

完成上一步后，Cloudflare 会显示一个重要页面：

**标题：更改您的 Nameservers**

会显示类似这样的两个名称服务器（每个账号不同）：
```
示例：
alina.ns.cloudflare.com
dante.ns.cloudflare.com
```

**⚠️ 重要：先不要关闭这个页面！记下或截图保存这两个名称服务器地址。**

### 2.2 登录阿里云域名控制台

在新标签页打开：https://dc.console.aliyun.com/next/index

1. 使用你的阿里云账号登录
2. 进入 **"域名"** 管理页面
3. 找到你的域名：`alphaarena-live.com`

### 2.3 修改 DNS 服务器

#### 方法一：通过域名列表修改（推荐）

1. 在域名列表中，找到 `alphaarena-live.com`
2. 点击右侧的 **"管理"** 按钮
3. 在左侧菜单找到 **"DNS 修改"**
4. 或者在域名详情页面，找到 **"DNS 修改"** 入口

#### 具体操作：

1. 进入 **"DNS 修改"** 页面
2. 点击 **"修改 DNS 服务器"** 按钮
3. 会弹出确认框，选择 **"修改 DNS 服务器"**

4. **删除阿里云的默认 DNS：**
   - 删除：`dns1.hichina.com`
   - 删除：`dns2.hichina.com`

   或者类似的：
   - 删除：`vip1.alidns.com`
   - 删除：`vip2.alidns.com`

5. **添加 Cloudflare 的 DNS：**
   - 点击 **"添加 DNS 服务器"**
   - 输入第一个 Cloudflare nameserver（例如：`alina.ns.cloudflare.com`）
   - 点击 **"添加 DNS 服务器"**
   - 输入第二个 Cloudflare nameserver（例如：`dante.ns.cloudflare.com`）

6. **确认修改：**
   - 检查两个 Cloudflare nameservers 是否输入正确
   - 点击 **"确定"** 或 **"提交"** 按钮
   - 可能需要输入短信验证码或邮箱验证码

7. **重要提示框：**
   阿里云会弹出警告：
   ```
   修改 DNS 服务器后，域名解析将不再由阿里云 DNS 提供，
   请确保新的 DNS 服务器已配置好相应的解析记录。
   ```
   - 勾选 **"我已了解，继续修改"**
   - 点击 **"确定"**

### 2.4 确认修改成功

1. 修改成功后，页面会显示新的 DNS 服务器
2. 确认显示的是 Cloudflare 的两个 nameservers
3. 状态可能显示为 **"修改中"** 或 **"生效中"**

---

## ✅ 第三步：在 Cloudflare 确认配置

### 3.1 回到 Cloudflare 页面

返回刚才打开的 Cloudflare 标签页（显示 nameservers 的页面）

### 3.2 点击确认按钮

1. 在页面底部，点击 **"完成，检查名称服务器"** (Done, check nameservers) 按钮
2. Cloudflare 会开始检查你的域名 nameservers 是否已更改

### 3.3 等待激活

页面会显示：
```
正在检查您的名称服务器...
Checking your nameservers...
```

**情况 1：立即检测到更改**
- 显示 ✅ "域名已激活" (Domain is active)
- 你会收到 Cloudflare 的激活邮件
- 跳转到域名概览页面

**情况 2：尚未检测到更改**
- 显示 ⏳ "等待名称服务器更新" (Waiting for nameserver update)
- 这是正常的！DNS 更改需要时间传播
- Cloudflare 会自动定期检查（每小时一次）
- 你会收到邮件通知：**"开始使用 alphaarena-live.com"**

---

## ⏱️ 第四步：等待 DNS 传播（重要）

### 4.1 传播时间

DNS 更改需要时间在全球互联网传播：
- **最快**：10-30 分钟
- **一般**：2-4 小时
- **最慢**：24-48 小时

### 4.2 检查传播进度

#### 方法 1：使用在线工具

访问：https://dnschecker.org/

1. 在输入框输入：`alphaarena-live.com`
2. 选择类型：**NS**（Nameserver）
3. 点击 **"Search"**
4. 查看全球各地的查询结果：
   - ✅ 绿色勾 = 已更新为 Cloudflare nameservers
   - ❌ 红色叉 = 仍然是旧的 DNS
   - 等待大部分地区变成绿色勾

#### 方法 2：使用命令行（Windows）

打开 PowerShell 或 CMD，输入：
```bash
nslookup -type=ns alphaarena-live.com
```

如果显示 Cloudflare 的 nameservers，说明已生效。

### 4.3 等待 Cloudflare 激活邮件

你会收到来自 Cloudflare 的邮件：
- 主题：**"alphaarena-live.com is now active on a Cloudflare Free plan"**
- 或中文：**"alphaarena-live.com 现已在 Cloudflare Free 计划上激活"**

收到这封邮件后，说明域名已成功迁移到 Cloudflare！✅

---

## 🚀 第五步：配置 Cloudflare Workers 自定义域名

### 5.1 确认域名已激活

1. 访问：https://dash.cloudflare.com/
2. 你应该能看到 `alphaarena-live.com` 在站点列表中
3. 状态显示为 **"Active"** 或 **"激活"**

### 5.2 等待 Worker 部署完成

1. 访问：https://github.com/coolcatcool-code/alphaarena-live/actions
2. 确认最新的 workflow 已成功部署
3. Worker 名称应该是：`alphaarena-live`

### 5.3 为 Worker 添加自定义域名

#### 步骤 1：进入 Workers 管理页面

1. 访问：https://dash.cloudflare.com/
2. 点击左侧菜单的 **"Workers & Pages"**
3. 找到并点击 `alphaarena-live`

#### 步骤 2：添加 www 子域名

1. 点击顶部的 **"Settings"** (设置) 标签
2. 滚动找到 **"Domains & Routes"** (域名和路由) 部分
3. 点击 **"Add Custom Domain"** (添加自定义域名) 按钮
4. 在弹出框中输入：`www.alphaarena-live.com`
5. 点击 **"Add Custom Domain"** 确认

**Cloudflare 会自动：**
- ✅ 创建 DNS 记录（CNAME 指向 Worker）
- ✅ 配置 SSL 证书
- ✅ 启用 HTTPS

等待 5-10 秒，应该显示 ✅ **"Active"** 状态

#### 步骤 3：添加根域名（推荐）

重复上述步骤，添加根域名：

1. 再次点击 **"Add Custom Domain"**
2. 输入：`alphaarena-live.com`（不带 www）
3. 点击 **"Add Custom Domain"**

这样访问 `alphaarena-live.com` 也能自动跳转到你的网站。

---

## 🔒 第六步：配置 SSL/TLS（自动完成）

### 6.1 检查 SSL 设置

1. 在 Cloudflare Dashboard 中，点击 `alphaarena-live.com`
2. 左侧菜单点击 **"SSL/TLS"**
3. 确认加密模式：
   - 推荐设置：**"Full (strict)"** - 端到端加密
   - 如果遇到问题可临时用：**"Flexible"**

### 6.2 启用强制 HTTPS

1. 在 **"SSL/TLS"** 页面
2. 点击 **"边缘证书"** (Edge Certificates) 标签
3. 找到 **"始终使用 HTTPS"** (Always Use HTTPS)
4. 打开开关 🔵→🟢

### 6.3 启用自动 HTTPS 重写

1. 在 **"边缘证书"** 标签
2. 找到 **"自动 HTTPS 重写"** (Automatic HTTPS Rewrites)
3. 打开开关 🔵→🟢

---

## ⚡ 第七步：性能优化设置（可选）

### 7.1 启用 Brotli 压缩

1. 左侧菜单点击 **"速度"** (Speed) → **"优化"** (Optimization)
2. 找到 **"Brotli"**
3. 打开开关 🔵→🟢

### 7.2 启用自动压缩

1. 在 **"优化"** 页面
2. 找到 **"Auto Minify"** (自动压缩)
3. 勾选：
   - ✅ JavaScript
   - ✅ CSS
   - ✅ HTML

---

## ✅ 第八步：验证网站访问

### 8.1 测试 HTTPS 访问

在浏览器中访问以下 URL：

1. https://www.alphaarena-live.com
2. https://alphaarena-live.com
3. http://www.alphaarena-live.com （应自动跳转到 HTTPS）

**应该都能正常访问你的网站！** 🎉

### 8.2 检查 SSL 证书

1. 点击浏览器地址栏的🔒锁图标
2. 点击 **"证书"** (Certificate)
3. 确认：
   - 颁发者：Cloudflare Inc
   - 有效期：自动续期
   - 状态：✅ 有效

### 8.3 测试 SSL 评级（可选）

访问：https://www.ssllabs.com/ssltest/

1. 输入：`www.alphaarena-live.com`
2. 点击 **"Submit"**
3. 等待几分钟测试完成
4. 应该得到 **A** 或 **A+** 评级！

---

## 📊 第九步：监控和验证

### 9.1 查看 Cloudflare Analytics

1. 在 Cloudflare Dashboard
2. 点击 `alphaarena-live.com`
3. 左侧菜单 **"分析和日志"** (Analytics & Logs)
4. 查看流量统计、请求数、带宽等

### 9.2 查看 Worker 日志

1. 进入 **"Workers & Pages"**
2. 点击 `alphaarena-live`
3. 点击 **"Logs"** 标签
4. 可以看到实时请求日志

---

## 🎯 第十步：更新 Google Search Console

### 10.1 添加新资源

1. 访问：https://search.google.com/search-console
2. 点击左上角的资源选择器
3. 点击 **"添加资源"**
4. 选择 **"网址前缀"**
5. 输入：`https://www.alphaarena-live.com`
6. 点击 **"继续"**

### 10.2 验证所有权

选择验证方式：

**推荐方式 1：DNS 记录验证**
1. 选择 **"DNS 记录"**
2. 复制 TXT 记录值
3. 在 Cloudflare DNS 中添加 TXT 记录：
   - 名称：`@`
   - 内容：（粘贴 Google 提供的值）
   - TTL：自动
4. 点击 **"验证"**

**方式 2：HTML 标签**
1. 复制 Google 提供的 meta 标签
2. 添加到 `src/app/layout.tsx` 的 metadata 中
3. 部署后验证

### 10.3 提交 Sitemap

1. 在 Google Search Console 左侧菜单
2. 点击 **"站点地图"** (Sitemaps)
3. 输入：`sitemap.xml`
4. 点击 **"提交"**

---

## ✨ 完成！

恭喜！🎉 域名迁移完成！

你的网站现在：
- ✅ 运行在 Cloudflare Workers 上
- ✅ 使用免费 SSL 证书（自动续期）
- ✅ 享受全球 CDN 加速
- ✅ 每天 100,000 次免费请求
- ✅ DDoS 防护
- ✅ 自动扩展，无限流量

访问 https://www.alphaarena-live.com 查看你的网站！🚀

---

## ❓ 常见问题

### Q1: 修改 Nameservers 后多久生效？
A: 通常 2-4 小时，最长 48 小时。可以使用 dnschecker.org 检查进度。

### Q2: 修改期间网站会无法访问吗？
A: 不会！DNS 传播期间，部分用户访问新 DNS，部分访问旧 DNS，网站持续可访问。

### Q3: 如果遇到 SSL 错误怎么办？
A:
1. 检查 SSL/TLS 模式是否设置为 "Flexible" 或 "Full"
2. 等待 5-10 分钟让 SSL 证书生效
3. 清除浏览器缓存重试

### Q4: 如何回滚到阿里云 DNS？
A: 在阿里云域名管理中，重新修改 nameservers 为阿里云的 DNS 即可。

### Q5: 域名迁移会影响 SEO 吗？
A: 不会！只是更换托管服务商和 DNS，URL 和内容不变，对 SEO 无影响。

---

## 📞 需要帮助？

如有问题，请随时告诉我：
- 在哪一步遇到困难
- 具体的错误信息或截图
- 我会继续协助你完成迁移！

开始第一步吧！🚀
