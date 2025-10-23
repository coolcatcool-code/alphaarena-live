# 🚀 OpenRouter AI自动化设置指南

## 为什么选择OpenRouter？

✅ **支持100+模型** - GPT-4, Claude, DeepSeek, Llama等
✅ **更便宜** - 比直接用OpenAI便宜30-50%
✅ **有免费模型** - Google Gemini 2.0 Flash完全免费
✅ **统一接口** - 一个API key访问所有模型
✅ **按需付费** - 充值$5即可开始，无月费

## 🎯 3分钟快速设置

### 步骤1: 获取OpenRouter API Key（1分钟）

1. 访问 https://openrouter.ai/keys
2. 使用Google账号登录
3. 点击 **Create Key**
4. 输入名称: `Alpha Arena`
5. 复制生成的key（格式：`sk-or-v1-xxx...`）

💰 **充值**: 访问 https://openrouter.ai/credits 充值$5（可用很久）

### 步骤2: 选择AI模型

访问 https://openrouter.ai/models 查看所有模型

**推荐模型对比**:

| 模型 | 价格/百万token | 质量 | 速度 | 推荐用途 |
|------|----------------|------|------|----------|
| **google/gemini-2.0-flash-exp:free** | **免费** ⭐ | 🌟🌟🌟🌟 | ⚡⚡⚡ | 免费用户首选 |
| **deepseek/deepseek-chat** | $0.14/$0.28 | 🌟🌟🌟🌟 | ⚡⚡⚡ | 超便宜，中文友好 |
| **openai/gpt-4o-mini** | $0.15/$0.60 | 🌟🌟🌟🌟🌟 | ⚡⚡ | 平衡质量和成本 |
| **anthropic/claude-3.5-sonnet** | $3.00/$15.00 | 🌟🌟🌟🌟🌟 | ⚡⚡ | 质量最高 |
| **meta-llama/llama-3.1-70b** | $0.35/$0.40 | 🌟🌟🌟🌟 | ⚡⚡ | 开源，性价比高 |

**我的推荐**:
- 💰 **预算有限**: `google/gemini-2.0-flash-exp:free` (免费！)
- 💵 **低成本**: `deepseek/deepseek-chat` (每月约$0.50)
- ⚖️ **平衡**: `openai/gpt-4o-mini` (每月约$1.50)
- 💎 **质量优先**: `anthropic/claude-3.5-sonnet` (每月约$10)

### 步骤3: 配置GitHub Secrets（2分钟）

1. 访问 https://github.com/你的用户名/alphaarena-live/settings/secrets/actions
2. 点击 **New repository secret**

**添加Secret 1**:
```
Name: OPENROUTER_API_KEY
Value: sk-or-v1-你的key
```

**添加Secret 2**:
```
Name: AI_MODEL
Value: google/gemini-2.0-flash-exp:free
```
（或选择其他模型，见上表）

**添加Secret 3和4**（如果还没添加）:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://kqalqqnuliuszwljfosz.supabase.co

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGci...（你的key）
```

### 步骤4: 测试运行

1. 访问 https://github.com/你的用户名/alphaarena-live/actions
2. 点击 **Generate Daily AI Articles**
3. 点击 **Run workflow** → **Run workflow**
4. 等待2-3分钟

✅ 绿色勾号 = 成功！

## 🧪 本地测试（可选）

添加到 `.env.local`:
```env
OPENROUTER_API_KEY=sk-or-v1-你的key
AI_MODEL=google/gemini-2.0-flash-exp:free
```

运行测试:
```bash
pnpm generate-ai-articles
```

## 💰 成本对比

### 免费方案（推荐新手）
**模型**: `google/gemini-2.0-flash-exp:free`
- **日成本**: $0
- **月成本**: $0
- **年成本**: $0
- **限制**: 有请求频率限制

### 超低成本方案
**模型**: `deepseek/deepseek-chat`
- **每篇文章**: ~$0.006
- **每天2篇**: ~$0.012
- **月成本**: ~$0.36
- **年成本**: ~$4.38

### 推荐方案
**模型**: `openai/gpt-4o-mini`
- **每篇文章**: ~$0.025
- **每天2篇**: ~$0.05
- **月成本**: ~$1.50
- **年成本**: ~$18.25

### 高质量方案
**模型**: `anthropic/claude-3.5-sonnet`
- **每篇文章**: ~$0.50
- **每天2篇**: ~$1.00
- **月成本**: ~$30
- **年成本**: ~$365

**对比OpenAI直接调用**:
- OpenAI GPT-4o直接: ~$32/月
- OpenRouter GPT-4o: ~$22/月
- **节省**: 30%+

## 🎨 自定义模型

### 方法1: 环境变量（推荐）

在 `.env.local` 中设置:
```env
AI_MODEL=anthropic/claude-3.5-sonnet
```

### 方法2: GitHub Secrets

在GitHub Secrets中设置 `AI_MODEL`

### 方法3: 修改脚本默认值

编辑 `scripts/generate-ai-article.ts`:
```typescript
const AI_MODEL = process.env.AI_MODEL || 'your-preferred-model'
```

## 📊 查看使用情况

访问 https://openrouter.ai/activity 查看:
- 每日API调用次数
- 费用消耗
- 模型使用分布

## 🔧 切换模型实验

试试不同模型，找到最适合你的：

```bash
# 测试Gemini（免费）
AI_MODEL=google/gemini-2.0-flash-exp:free pnpm generate-ai-articles

# 测试DeepSeek（便宜）
AI_MODEL=deepseek/deepseek-chat pnpm generate-ai-articles

# 测试Claude（质量高）
AI_MODEL=anthropic/claude-3.5-sonnet pnpm generate-ai-articles

# 测试Llama（开源）
AI_MODEL=meta-llama/llama-3.1-70b-instruct pnpm generate-ai-articles
```

比较生成的文章质量，选择最合适的！

## 🎯 模型选择建议

### 场景1: 刚开始测试
**推荐**: `google/gemini-2.0-flash-exp:free`
- 完全免费
- 质量不错
- 适合验证系统

### 场景2: 长期运营，预算有限
**推荐**: `deepseek/deepseek-chat`
- 超便宜（每月<$1）
- 中文支持好
- 质量可接受

### 场景3: 追求质量
**推荐**: `anthropic/claude-3.5-sonnet`
- 文章质量最高
- 逻辑清晰
- 值得投资

### 场景4: 平衡方案
**推荐**: `openai/gpt-4o-mini`
- 质量和价格平衡
- 稳定可靠
- 官方支持

## 🐛 故障排查

### 问题1: "Missing OPENROUTER_API_KEY"
**解决**: 检查 `.env.local` 或GitHub Secrets是否正确设置

### 问题2: "Rate limit exceeded"（免费模型）
**原因**: 免费模型有频率限制
**解决**:
- 等待几分钟再试
- 或切换到付费模型

### 问题3: "Insufficient credits"
**原因**: OpenRouter余额不足
**解决**: 访问 https://openrouter.ai/credits 充值

### 问题4: 文章质量不理想
**解决**:
1. 尝试更高质量的模型
2. 调整 `temperature` (scripts/generate-ai-article.ts)
3. 优化prompt内容

## 📚 更多资源

- **OpenRouter官网**: https://openrouter.ai
- **模型列表**: https://openrouter.ai/models
- **价格对比**: https://openrouter.ai/models?order=price
- **文档**: https://openrouter.ai/docs
- **Discord社区**: https://discord.gg/openrouter

## ✅ 检查清单

设置完成后确认:

- [ ] OpenRouter API key已获取
- [ ] 已选择合适的AI模型
- [ ] GitHub Secrets已配置（OPENROUTER_API_KEY和AI_MODEL）
- [ ] 手动测试workflow成功
- [ ] （可选）已充值OpenRouter余额
- [ ] （可选）本地测试成功

## 🎉 完成！

系统将：
- ✅ 每天早上8点自动运行
- ✅ 使用你选择的AI模型生成2篇文章
- ✅ 自动提交到GitHub
- ✅ 自动部署到网站

**享受完全自动化的AI内容生成！** 🚀

---

**推荐配置**:
- API: OpenRouter
- 模型: `google/gemini-2.0-flash-exp:free` (免费) 或 `deepseek/deepseek-chat` (便宜)
- 月成本: $0 - $1
