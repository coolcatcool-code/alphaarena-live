# ☁️ Cloudflare Pages 正确配置

## ✅ 构建设置（重要！）

在 Cloudflare Pages Dashboard 中，确保设置如下：

### Framework Settings

```yaml
Framework preset: Next.js
Build command: pnpm build
Build output directory: .next
Root directory: (留空)
```

### 重要说明

**❌ 不要设置以下内容：**
- ~~Deploy command~~（留空，Pages 会自动处理）
- ~~Custom deployment script~~（不需要）
- ~~wrangler deploy~~（这是 Workers 的命令）

**✅ Pages 会自动：**
- 运行 `pnpm build`
- 检测 `.next` 输出目录
- 自动部署构建结果
- 处理函数路由

---

## 🔧 如何配置

### 1. 进入项目设置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Workers & Pages** → 点击你的项目
3. **Settings** → **Builds & deployments**

### 2. 检查构建配置

确保这些设置正确：

| 设置项 | 值 | 备注 |
|--------|-----|------|
| **Production branch** | `main` | ✅ |
| **Build command** | `pnpm build` | ✅ |
| **Build output directory** | `.next` | ✅ |
| **Root directory** | (empty) | ✅ |
| **Node version** | `20` | ✅ |

### 3. 环境变量

在 **Settings** → **Environment variables** 中添加：

**Production 环境：**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
OPENROUTER_API_KEY=sk-or-xxx...
CRON_SECRET=your-random-secret
NEXT_PUBLIC_APP_URL=https://alphaarena-live.pages.dev
```

**Preview 环境：**
（复制相同的变量）

---

## 🚫 常见错误

### 错误 1: "Workers-specific command in Pages project"

**原因**：存在 `wrangler.toml` 或配置了 deploy command

**解决**：
```bash
# 删除 wrangler.toml（已完成）
git rm wrangler.toml
git commit -m "Remove wrangler.toml"
git push
```

### 错误 2: "supabaseUrl is required"

**原因**：环境变量未配置

**解决**：
1. 进入 **Settings** → **Environment variables**
2. 添加所有必需的环境变量
3. 确保在 **Production** 和 **Preview** 都添加
4. 点击 **Save**
5. 重新部署（**Deployments** → **Retry deployment**）

### 错误 3: Build 失败

**检查**：
1. **Deployment logs** 中的具体错误
2. Node.js 版本是否正确（20.x）
3. `pnpm-lock.yaml` 是否提交到 Git

---

## 🔄 触发重新部署

有两种方式：

### 方法 1: 推送代码（推荐）
```bash
git commit --allow-empty -m "redeploy"
git push origin main
```

### 方法 2: Dashboard 重试
1. **Deployments** → 点击失败的部署
2. 点击 **Retry deployment**

---

## ✅ 成功部署的标志

部署成功后，你会看到：

1. **Deployment status**: ✅ Success
2. **访问 URL**: `https://alphaarena-live.pages.dev`
3. **Functions**: 所有 API routes 部署成功
4. **预览**：网站可以访问

### 测试部署

```bash
# 测试首页
curl https://alphaarena-live.pages.dev

# 测试 API
curl https://alphaarena-live.pages.dev/api/leaderboard

# 应该返回 JSON 数据
```

---

## 📊 部署流程

```
1. 推送代码到 GitHub
   ↓
2. Cloudflare 检测到变更
   ↓
3. 克隆仓库
   ↓
4. 安装依赖 (pnpm install)
   ↓
5. 运行 Prisma generate
   ↓
6. 构建项目 (pnpm build)
   ↓
7. 上传 .next 目录
   ↓
8. 配置路由和函数
   ↓
9. 部署成功 ✅
```

---

## 🎯 关键点总结

### ✅ 需要做的

- 使用 Git 集成部署
- 配置正确的环境变量
- 设置 `pnpm build` 作为构建命令
- 指定 `.next` 作为输出目录

### ❌ 不需要做的

- ~~安装 wrangler CLI~~
- ~~运行 wrangler deploy~~
- ~~配置 wrangler.toml~~
- ~~设置 deploy command~~

---

## 📚 相关文档

- [Cloudflare Pages - Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Pages Build Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Environment Variables](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)

---

## 🆘 遇到问题？

1. **查看构建日志**
   - Deployments → 点击失败的部署 → 查看完整日志

2. **检查环境变量**
   - Settings → Environment variables → 确认所有变量都已添加

3. **验证构建设置**
   - Settings → Builds & deployments → 确认配置正确

4. **尝试重新部署**
   - Deployments → Retry deployment

---

**现在应该可以成功部署了！** 🎉

删除 `wrangler.toml` 后，Cloudflare Pages 会使用正确的 Pages 部署流程。
