# Cron-Job.org 设置指南

## 🎯 目标
使用免费的 cron-job.org 服务，每分钟自动调用 `/api/sync` 端点，从 nof1.ai 同步最新数据到 Supabase。

## 📋 步骤

### 1. 注册 cron-job.org 账号

1. 访问：https://cron-job.org
2. 点击右上角 **Sign up**
3. 填写注册信息：
   - Email（你的邮箱）
   - Password（设置密码）
4. 验证邮箱
5. 登录账号

### 2. 创建新的 Cron Job

登录后，按以下步骤创建定时任务：

#### 2.1 基本设置

1. 点击 **Cronjobs** 菜单
2. 点击 **Create cronjob** 按钮
3. 填写表单：

**Title（任务名称）**：
```
Alpha Arena - Sync Trading Data
```

**Address（URL）**：
```
https://alphaarena-live.com/api/sync
```

**Request method（请求方法）**：
```
POST
```

#### 2.2 定时设置

在 **Schedule** 部分：

**选项1：使用简单模式**
- 选择 **Every minute**

**选项2：使用高级模式（推荐，更灵活）**
- 切换到 **Advanced** 标签
- 输入 Cron 表达式：
```
* * * * *
```

这表示：
- `*` - 每分钟
- `*` - 每小时
- `*` - 每天
- `*` - 每月
- `*` - 每周

#### 2.3 高级设置（可选但推荐）

展开 **Advanced** 部分：

**Timeout（超时时间）**：
```
30 seconds
```

**Notifications（通知设置）**：
- ✅ 勾选 **Notify me if execution fails**
- 填写你的邮箱（接收失败通知）

**Request headers（请求头，可选）**：
如果需要添加认证，可以添加：
```
Content-Type: application/json
```

**Expected response（期望响应）**：
- Status code: `200`

#### 2.4 保存任务

1. 点击底部的 **Create cronjob** 按钮
2. 任务创建成功！

### 3. 验证任务运行

#### 3.1 查看执行历史

1. 在 Cronjobs 列表中找到你的任务
2. 点击任务名称进入详情页
3. 查看 **History** 标签
4. 应该能看到每分钟的执行记录

#### 3.2 检查执行结果

每次执行后，你应该看到：
- **Status**: 200 OK（绿色）
- **Response time**: <5秒
- **Response body**:
```json
{
  "success": true,
  "synced": {
    "snapshots": 6,
    "positions": 29,
    "trades": 100
  },
  "timestamp": "2025-10-22T..."
}
```

### 4. 监控和管理

#### 4.1 暂停任务

如果需要临时暂停：
1. 进入任务详情页
2. 点击 **Enable/Disable** 切换按钮
3. 任务会停止执行

#### 4.2 修改定时

如果需要改变频率（例如从1分钟改为5分钟）：
1. 编辑任务
2. 修改 Schedule 为 `*/5 * * * *`
3. 保存

#### 4.3 查看统计

在任务详情页可以看到：
- Total executions（总执行次数）
- Success rate（成功率）
- Average response time（平均响应时间）

## ✅ 完成后的效果

### 数据流程
```
每分钟
    ↓
cron-job.org 触发
    ↓
POST https://alphaarena-live.com/api/sync
    ↓
从 nof1.ai 获取最新数据
    ↓
同步到 Supabase 数据库
    ↓
前端每分钟刷新显示最新数据
```

### 用户体验
1. 用户访问网站
2. 看到实时的交易数据
3. 每分钟数据自动更新
4. 无需任何手动操作

## 🔍 故障排查

### 问题1: 任务显示失败（红色）

**可能原因**：
- API 返回非 200 状态码
- 请求超时
- 网站暂时不可用

**解决方法**：
1. 检查 Vercel 部署状态
2. 手动访问 API 测试：
```bash
curl -X POST https://alphaarena-live.com/api/sync
```
3. 查看 Vercel 函数日志

### 问题2: 执行成功但数据未更新

**检查步骤**：
1. 查看响应内容是否正确
2. 检查 Supabase 数据库是否有新数据：
   - 访问 Supabase Dashboard
   - 查看 `snapshots`, `positions`, `trades` 表
   - 检查 `timestamp` 字段是否更新
3. 检查前端是否正确读取数据

### 问题3: 响应时间过长

**优化建议**：
1. 检查 nof1.ai API 响应速度
2. 优化数据库查询
3. 考虑增加超时时间到 60 秒

## 📊 监控建议

### 每日检查
- 成功率应该 > 95%
- 平均响应时间 < 5秒
- 同步的数据条数稳定（snapshots: 6-7, positions: 20-40, trades: 100）

### 告警设置
在 cron-job.org 中设置：
- ✅ 执行失败时发送邮件
- ✅ 连续3次失败时发送通知

## 🔐 安全建议

### 添加验证（可选）

如果想防止别人恶意调用你的 sync API，可以添加密钥验证：

#### 1. 更新 sync API

在 `src/app/api/sync/route.ts` 中添加：

```typescript
export async function POST(request: Request) {
  // 验证密钥
  const authHeader = request.headers.get('authorization')
  const expectedKey = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 原有的同步逻辑...
}
```

#### 2. 在 Vercel 设置环境变量

添加：
```
CRON_SECRET=your-secret-key-here-change-this
```

#### 3. 在 cron-job.org 添加请求头

在任务的 **Request headers** 中添加：
```
Authorization: Bearer your-secret-key-here-change-this
```

## 🎉 全部完成！

现在你的系统完全自动化运行：

1. ✅ cron-job.org 每分钟触发同步
2. ✅ 数据从 nof1.ai 同步到 Supabase
3. ✅ 前端每分钟刷新显示最新数据
4. ✅ 完全免费，无需 Vercel Pro
5. ✅ 可靠性高，有执行历史和通知

## 📞 支持

- cron-job.org 文档：https://docs.cron-job.org
- cron-job.org 支持：support@cron-job.org

## 🔄 备选方案

如果 cron-job.org 出现问题，可以使用：
- EasyCron: https://www.easycron.com
- UptimeRobot: https://uptimerobot.com（最小5分钟间隔）
- GitHub Actions（参考 DEPLOYMENT.md）
