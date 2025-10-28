# 🚀 Cloudflare D1 数据库快速配置指南

## 📝 前置条件

- ✅ 已安装 `wrangler` CLI
- ✅ 已登录 Cloudflare 账号

```bash
# 检查wrangler是否已安装
npx wrangler --version

# 如果未登录，先登录
npx wrangler login
```

---

## 🔧 配置步骤（5分钟完成）

### Step 1: 创建 D1 数据库

```bash
cd C:\Users\Zero\trae\alphaarena

# 创建名为 alphaarena-db 的D1数据库
npx wrangler d1 create alphaarena-db
```

**预期输出**:
```
✅ Successfully created DB 'alphaarena-db'

[[d1_databases]]
binding = "DB"
database_name = "alphaarena-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**⚠️ 重要**: 复制输出中的 `database_id`！

### Step 2: 更新 wrangler.toml

打开 `wrangler.toml` 文件，找到被注释的 D1 配置部分：

```toml
# [[d1_databases]]
# binding = "DB"
# database_name = "alphaarena-db"
# database_id = "your-database-id"  # 替换为实际的database_id
```

**取消注释并替换 `database_id`**:

```toml
[[d1_databases]]
binding = "DB"
database_name = "alphaarena-db"
database_id = "你刚才复制的database_id"
```

### Step 3: 创建数据表

```bash
# 执行SQL脚本创建表结构
npx wrangler d1 execute alphaarena-db --file=./migrations/d1-schema.sql
```

**预期输出**:
```
🌀 Mapping SQL input into an array of statements
🌀 Parsing 5 statements
🌀 Executing on alphaarena-db (你的database_id):
🚣 Executed 5 commands in 0.123s
```

### Step 4: 验证数据库

```bash
# 查看表列表
npx wrangler d1 execute alphaarena-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# 查看表结构
npx wrangler d1 execute alphaarena-db --command="PRAGMA table_info(leaderboard_cache)"
```

**预期输出**:
```
┌───────────────────────────┐
│ name                      │
├───────────────────────────┤
│ leaderboard_cache         │
│ recent_trades_cache       │
│ daily_stats_cache         │
│ model_performance_cache   │
│ crypto_prices_cache       │
└───────────────────────────┘
```

---

## ✅ 完成！

D1 数据库已成功配置！

### 下一步操作：

1. **部署Workers**:
   ```bash
   pnpm workers:deploy
   ```

2. **测试数据同步**:
   ```bash
   curl -H "Authorization: Bearer your_cron_secret" \
     https://alphaarena-live.workers.dev/api/cron/sync-all
   ```

3. **查看D1数据**:
   ```bash
   # 查看排行榜缓存
   npx wrangler d1 execute alphaarena-db \
     --command="SELECT * FROM leaderboard_cache"

   # 查看最新交易
   npx wrangler d1 execute alphaarena-db \
     --command="SELECT * FROM recent_trades_cache LIMIT 10"
   ```

---

## 📊 D1 数据库管理命令

### 查询数据

```bash
# 查看排行榜
npx wrangler d1 execute alphaarena-db \
  --command="SELECT model_id, equity, return_pct, rank FROM leaderboard_cache ORDER BY rank"

# 统计交易数量
npx wrangler d1 execute alphaarena-db \
  --command="SELECT COUNT(*) as total FROM recent_trades_cache"

# 查看今日统计
npx wrangler d1 execute alphaarena-db \
  --command="SELECT * FROM daily_stats_cache ORDER BY date DESC LIMIT 7"
```

### 清空缓存

```bash
# 清空所有缓存（重新开始）
npx wrangler d1 execute alphaarena-db \
  --command="DELETE FROM leaderboard_cache"

npx wrangler d1 execute alphaarena-db \
  --command="DELETE FROM recent_trades_cache"
```

### 导出数据

```bash
# 导出排行榜为JSON
npx wrangler d1 execute alphaarena-db \
  --command="SELECT * FROM leaderboard_cache" \
  --json > leaderboard_export.json
```

---

## 🐛 常见问题

### Q: 提示 "D1 database not found"

**A**: 确保 `wrangler.toml` 中的 `database_id` 正确，并且已经创建了数据库。

### Q: SQL 执行失败

**A**: 检查 `migrations/d1-schema.sql` 文件是否存在且语法正确。

### Q: Workers 访问不到 D1

**A**:
1. 确认 `wrangler.toml` 中 D1 配置未被注释
2. 重新部署 Workers: `pnpm workers:deploy`
3. 检查代码中是否使用了 `env.DB` 访问数据库

---

## 💡 提示

- D1 数据库免费额度：5GB 存储 + 每天 500万次读取
- 数据自动在全球200+节点复制
- 响应时间通常 < 10ms
- 支持 SQLite 语法

---

## 📖 参考资料

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [D1 SQL 参考](https://developers.cloudflare.com/d1/platform/client-api/)
