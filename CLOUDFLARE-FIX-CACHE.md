# 🔧 Cloudflare Pages - 缓存问题完整解决方案

## 问题

```
✘ [ERROR] Error: Pages only supports files up to 25 MiB in size
cache/webpack/server-production/0.pack is 56 MiB in size
```

## 根本原因

Next.js 的 webpack 会在构建时生成缓存文件，这些文件可能超过 Cloudflare Pages 的 25 MiB 单文件限制。

---

## ✅ 完整解决方案（3步）

### 步骤 1: 在 Cloudflare Dashboard 添加环境变量

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入你的 Pages 项目
3. **Settings** → **Environment variables**
4. 添加以下变量（**Production 和 Preview 都要添加**）：

| 变量名 | 值 |
|--------|-----|
| `NEXT_DISABLE_CACHE` | `1` |
| `NODE_ENV` | `production` |
| `NEXT_TELEMETRY_DISABLED` | `1` |

5. 点击 **Save**

### 步骤 2: 确认 next.config.js 配置

确保 `next.config.js` 包含以下配置（已完成）：

```javascript
webpack: (config, { isServer }) => {
  // Completely disable webpack cache
  config.cache = false

  if (config.cache && typeof config.cache === 'object') {
    config.cache.type = 'memory'
  }

  return config
},
generateBuildId: async () => {
  return `build-${Date.now()}`
},
```

### 步骤 3: 确认 package.json 构建命令

确保包含缓存清理（已完成）：

```json
{
  "scripts": {
    "build": "prisma generate && next build && rm -rf .next/cache || true"
  }
}
```

---

## 🔍 验证方法

### 在 Cloudflare Dashboard 检查：

1. **Deployments** → 点击最新部署
2. 查看构建日志：
   - ✅ 应该看到 "Finished"
   - ✅ 应该看到 "Validating asset output directory"
   - ✅ 应该**没有** "25 MiB" 错误

### 如果还有问题：

查看日志中 "Validating asset output directory" 部分的具体错误。

---

## 📊 分层防御策略

| 层级 | 方法 | 文件 |
|------|------|------|
| **1. 配置禁用** | webpack cache = false | `next.config.js` |
| **2. 环境变量** | NEXT_DISABLE_CACHE=1 | Cloudflare env vars |
| **3. 构建后清理** | rm -rf .next/cache | `package.json` |
| **4. 忽略文件** | .next/cache/ | `.cfignore` |

---

## 🆘 故障排除

### 问题: 仍然出现 25 MiB 错误

**检查清单：**

1. ✅ 环境变量是否在 **Production 和 Preview** 都添加了？
2. ✅ 是否重新部署了（添加环境变量后需要重新部署）？
3. ✅ `next.config.js` 是否已更新并推送到 Git？
4. ✅ 构建日志中是否显示了环境变量加载？

### 问题: 构建时间变长

**原因**: 禁用缓存后，每次构建都是完全重新编译

**对比**:
- 启用缓存: ~2 分钟
- 禁用缓存: ~3-4 分钟

**权衡**: 为了符合 Cloudflare 限制，这是必要的代价。

---

## 💡 替代方案

如果禁用缓存后构建仍然失败，考虑：

### 方案 A: 使用 Vercel（推荐）

- ✅ 无 25 MiB 文件大小限制
- ✅ 原生 Next.js 支持
- ✅ 无需禁用缓存
- ❌ 免费额度有带宽限制（100GB/月）

### 方案 B: 自托管

- ✅ 无任何限制
- ✅ 完全控制
- ❌ 需要服务器维护

### 方案 C: 继续优化 Cloudflare

- 减少依赖包大小
- 使用 code splitting
- 优化图片和资源

---

## 📚 相关文档

- [Cloudflare Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Next.js Webpack Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)

---

## ✅ 验证成功的标志

部署成功后你应该看到：

```
✓ Generating static pages (20/20)
Finished

Checking for configuration in a Wrangler configuration file (BETA)
No wrangler.toml file found. Continuing.
Validating asset output directory

✨ Success! Uploaded 123 files (4.56 sec)

✨ Deployment complete!
```

**没有** "25 MiB" 错误！

---

**更新时间**: 2025-10-28
**状态**: 测试中 🔄
