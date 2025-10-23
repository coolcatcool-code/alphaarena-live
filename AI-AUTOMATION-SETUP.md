# 🤖 AI自动化文章生成系统

## 🎯 系统概述

完全自动化的AI文章生成系统，**每天自动**从Supabase读取数据，使用OpenAI GPT-4生成高质量分析文章，并自动提交到GitHub。

**零维护**：设置完成后，系统每天自动运行，无需人工干预。

## ✨ 功能特点

### 1. AI驱动内容生成
- 使用GPT-4生成专业级金融分析文章
- 每篇800-1000字，包含数据分析和市场洞察
- 自动适应不同的市场状况和交易模式

### 2. 完全自动化
- GitHub Actions每天UTC 0点自动运行（北京时间早上8点）
- 自动获取最新数据
- 自动生成2篇文章
- 自动提交到GitHub
- 自动触发网站重新部署

### 3. 两种文章类型
- **每日报告**: 当天交易总结、排行榜分析、市场展望
- **策略分析**: AI交易策略对比、风险管理分析

## 🚀 快速设置（5分钟）

### 步骤1: 获取OpenAI API Key

1. 访问 https://platform.openai.com/api-keys
2. 登录/注册OpenAI账号
3. 点击 "Create new secret key"
4. 复制生成的key（格式：`sk-proj-...`）
5. 充值至少$5到账户（用于API调用）

**费用估算**: 每天生成2篇文章约$0.10-0.20，每月约$3-6

### 步骤2: 配置GitHub Secrets

1. 打开你的GitHub仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下3个secrets：

| Secret名称 | 值 | 说明 |
|-----------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kqalqqnuliuszwljfosz.supabase.co` | Supabase项目URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase Service Role Key |
| `OPENAI_API_KEY` | `sk-proj-...` | 你的OpenAI API密钥 |

### 步骤3: 推送代码到GitHub

```bash
# 添加所有文件
git add .

# 提交
git commit -m "feat: Add AI-powered article automation"

# 推送到GitHub
git push origin main
```

### 步骤4: 验证设置

1. 访问GitHub仓库 → **Actions** 标签
2. 点击 "Generate Daily AI Articles" workflow
3. 点击 **Run workflow** → **Run workflow** （手动测试）
4. 等待2-3分钟，查看运行结果

✅ **成功标志**:
- Workflow显示绿色✓
- `content/articles/` 目录出现新文章
- 自动创建了新的commit

## 📋 详细配置说明

### 文件结构

```
alphaarena/
├── .github/
│   └── workflows/
│       └── generate-articles.yml    # GitHub Actions配置
├── scripts/
│   ├── generate-article.ts          # 基础模板生成器
│   └── generate-ai-article.ts       # AI增强生成器 ⭐
├── content/
│   └── articles/                    # 生成的文章存放处
└── package.json                     # 包含 generate-ai-articles 脚本
```

### 环境变量说明

#### 本地开发 (`.env.local`)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kqalqqnuliuszwljfosz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# OpenAI
OPENAI_API_KEY=sk-proj-...
```

#### GitHub Secrets
所有上述环境变量都需要在GitHub Secrets中配置。

### GitHub Actions工作流详解

`.github/workflows/generate-articles.yml`:

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 每天UTC 0点 = 北京时间早上8点
  workflow_dispatch:      # 允许手动触发
```

**运行时间**:
- 自动: 每天早上8点（北京时间）
- 手动: 任何时候都可以在GitHub Actions页面手动触发

**执行步骤**:
1. 检出代码
2. 安装Node.js 20和pnpm
3. 安装依赖
4. 运行 `pnpm generate-ai-articles`
5. 检查是否有新文章生成
6. 如果有，自动commit并push

## 🎨 AI生成的文章质量

### 每日报告示例结构
```markdown
# Alpha Arena Daily Report - October 23, 2025

## Executive Summary
[AI分析今日整体市场表现]

## Current Leaderboard
### 1. DeepSeek R1
- PnL: +15.23%
- [AI深度分析表现原因]

## Trading Activity
[AI分析交易模式和趋势]

## Performance Analysis
[AI对比顶尖和落后者]

## Market Outlook
[AI预测未来趋势]

## Conclusion
[总结和行动建议]
```

### 策略分析示例结构
```markdown
# AI Trading Strategy Comparison

## Overview
[AI介绍各种策略]

## Strategy Profiles
[每个AI模型的详细策略分析]

## Comparative Analysis
[策略对比和优劣分析]

## Risk Management Approaches
[风险管理方法分析]

## Key Insights
[关键洞察]
```

## 🛠️ 本地测试

### 方法1: 测试AI文章生成

```bash
# 确保.env.local包含OPENAI_API_KEY
pnpm generate-ai-articles
```

**预期输出**:
```
🚀 Starting AI-powered article generation...

📊 Fetching data from Supabase...
🤖 Generating article with AI...
✅ Daily report generated!

✅ Daily report saved: daily-report-2025-10-23.md

---

📊 Fetching data for strategy analysis...
🤖 Generating strategy analysis with AI...
✅ Strategy analysis generated!

✅ Strategy analysis saved: strategy-analysis-2025-10-23.md

🎉 AI article generation complete!
```

### 方法2: 测试基础模板生成（无需API key）

```bash
pnpm generate-articles
```

## 📊 监控和维护

### 查看运行历史

1. 访问 GitHub仓库 → **Actions**
2. 查看 "Generate Daily AI Articles" 的运行记录
3. 点击任意运行查看详细日志

### 常见状态

| 状态 | 说明 | 操作 |
|------|------|------|
| ✅ 绿色成功 | 文章生成成功 | 无需操作 |
| ⚠️ 黄色警告 | 无新数据，未生成文章 | 检查数据同步 |
| ❌ 红色失败 | 出现错误 | 查看日志排查 |

### 检查生成的文章

```bash
# 查看最新文章
ls -lt content/articles/

# 查看今天的文章
cat content/articles/daily-report-$(date +%Y-%m-%d).md
```

## 🐛 故障排查

### 问题1: Workflow失败 - "Missing OPENAI_API_KEY"

**原因**: GitHub Secrets未配置

**解决**:
1. 检查 Settings → Secrets → Actions
2. 确认 `OPENAI_API_KEY` 存在
3. 重新运行workflow

### 问题2: 文章生成但质量不佳

**原因**: 数据不足或Prompt需要调整

**解决**:
1. 检查Supabase数据是否充足
2. 编辑 `scripts/generate-ai-article.ts` 中的prompt
3. 调整 `temperature` 参数（0.7默认，0.5更保守，0.9更创意）

### 问题3: API费用过高

**原因**: GPT-4调用次数多

**解决**:
```typescript
// 将模型从 gpt-4o 改为 gpt-3.5-turbo（更便宜）
model: 'gpt-3.5-turbo',  // 每篇约$0.02
```

### 问题4: Workflow没有自动运行

**原因**: GitHub Actions可能被禁用

**解决**:
1. Settings → Actions → General
2. 确保 "Allow all actions and reusable workflows" 已选中
3. 确保 "Read and write permissions" 已启用

### 问题5: 本地测试成功，GitHub失败

**原因**: Secrets配置错误

**检查清单**:
- [ ] Secret名称完全一致（大小写敏感）
- [ ] Secret值没有多余空格
- [ ] Secret值完整复制
- [ ] Workflow有权限访问secrets

## 💰 成本分析

### OpenAI API费用

**GPT-4o定价**（2025年10月）:
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens

**预估使用**:
- 每篇文章: ~3000 input tokens + ~1500 output tokens
- 每天2篇: ~6000 input + ~3000 output tokens
- **日费用**: 约 $0.045
- **月费用**: 约 $1.35
- **年费用**: 约 $16.50

**节省方案**:
使用 `gpt-3.5-turbo`:
- **日费用**: 约 $0.006
- **月费用**: 约 $0.18
- **年费用**: 约 $2.20

## 🎯 高级配置

### 调整运行时间

编辑 `.github/workflows/generate-articles.yml`:

```yaml
schedule:
  # 每天早上6点（北京时间下午2点）
  - cron: '0 6 * * *'

  # 每12小时运行一次
  - cron: '0 */12 * * *'

  # 仅工作日运行
  - cron: '0 0 * * 1-5'
```

在线工具: https://crontab.guru

### 自定义AI写作风格

编辑 `scripts/generate-ai-article.ts`:

```typescript
{
  role: 'system',
  content: 'You are a professional financial analyst...'  // ← 修改这里
}
```

**示例**:
- 更技术化: "You are a quantitative analyst specializing in algorithmic trading..."
- 更通俗: "You are a financial journalist writing for retail investors..."
- 更激进: "You are a crypto trader known for bold predictions..."

### 调整文章长度

```typescript
const prompt = `Write a comprehensive daily report (800-1000 words)...`
// 改为
const prompt = `Write a detailed daily report (1200-1500 words)...`
```

### 添加更多文章类型

```typescript
// 在 generate-ai-article.ts 中添加新函数
async function generateWeeklyRecap() {
  // 生成周报
}

async function generateMonthlyAnalysis() {
  // 生成月报
}
```

## 📈 效果追踪

### 文章生成统计

```bash
# 统计生成的文章数量
ls content/articles/ | wc -l

# 查看最近生成的文章
git log --grep="Auto-generate" --oneline

# 统计本月生成的文章
git log --since="1 month ago" --grep="Auto-generate" --oneline | wc -l
```

### SEO效果

- Google Search Console查看索引情况
- 追踪 "alpha arena", "ai trading competition" 等关键词排名
- 监控有机流量增长

## 🎁 额外功能

### 邮件通知（可选）

在workflow中添加邮件通知：

```yaml
- name: Send notification
  if: success()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: 'Daily articles generated ✅'
    body: 'New articles have been published!'
    to: your-email@example.com
```

### Slack通知（可选）

```yaml
- name: Slack notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Daily AI articles generated!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 📚 相关文档

- [ARTICLE-AUTOMATION.md](./ARTICLE-AUTOMATION.md) - 基础文章生成文档
- [CRON-JOB-SETUP.md](./CRON-JOB-SETUP.md) - Cron任务设置
- [OpenAI API文档](https://platform.openai.com/docs)
- [GitHub Actions文档](https://docs.github.com/en/actions)

## ✅ 设置完成检查清单

- [ ] OpenAI API Key已获取并充值
- [ ] GitHub Secrets已配置（3个）
- [ ] 代码已推送到GitHub
- [ ] 手动测试workflow成功
- [ ] 本地测试 `pnpm generate-ai-articles` 成功
- [ ] 查看生成的文章质量满意
- [ ] 确认自动commit工作正常

## 🎉 完成！

设置完成后，系统将：
- ✅ 每天早上8点自动运行
- ✅ 生成2篇高质量AI文章
- ✅ 自动提交到GitHub
- ✅ 触发Vercel重新部署
- ✅ 文章自动出现在网站上

**你需要做的**：什么都不用做！🎊

只需每月检查一次OpenAI账单，确保余额充足即可。

---

**最后更新**: 2025-10-23
**维护者**: Alpha Arena Team
**估计设置时间**: 5分钟
**月度成本**: $1-6（取决于使用的模型）
