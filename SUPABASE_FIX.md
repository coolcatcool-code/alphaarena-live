# Supabase修复步骤

## 问题
`buynhold_btc` AI模型在数据库中不存在，导致sync失败

## 解决方案

### 方法1：在Supabase SQL Editor运行

```sql
-- 简单的INSERT（如果不存在则插入）
INSERT INTO ai_models (id, name, description, color, created_at, updated_at)
VALUES ('buynhold_btc', 'Buy & Hold BTC', 'Simple buy and hold BTC strategy', '#F97316', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

### 方法2：在Supabase Table Editor手动添加

1. 进入 Supabase Dashboard
2. 选择 **Table Editor**
3. 选择 `ai_models` 表
4. 点击 **Insert row**
5. 填写：
   - id: `buynhold_btc`
   - name: `Buy & Hold BTC`
   - description: `Simple buy and hold BTC strategy`
   - color: `#F97316`

### 验证

运行以下SQL查询验证：

```sql
SELECT * FROM ai_models WHERE id = 'buynhold_btc';
```

应该返回1行数据。

### 完成后

重新测试sync API：
```bash
curl -X POST http://localhost:3002/api/sync
```

应该返回：
```json
{
  "success": true,
  "synced": {
    "snapshots": 6,
    "positions": 31,
    "trades": 100
  }
}
```
