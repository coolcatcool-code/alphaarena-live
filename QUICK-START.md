# 🚀 3分钟快速启动指南

## 让文章每天自动生成并发布到网站

### 步骤1: 获取OpenRouter API Key（1分钟）

1. 访问 https://openrouter.ai/keys
2. 使用Google账号登录
3. 点击 **Create Key**
4. 复制key（格式：`sk-or-v1-xxx...`）
5. （可选）充值$5 - 很多模型免费！

**推荐**: 使用免费的Gemini 2.0或便宜的DeepSeek
**费用**: $0（免费模型）或 每月$0.50-1.50（付费模型）

### 步骤2: 配置GitHub Secrets（1分钟）

1. 打开 https://github.com/你的用户名/alphaarena/settings/secrets/actions
2. 点击 **New repository secret**，添加4个secrets：

```
名称: OPENROUTER_API_KEY
值: sk-or-v1-...(你刚才复制的key)
```

```
名称: AI_MODEL
值: google/gemini-2.0-flash-exp:free
```
（或选择其他模型，见 [OPENROUTER-SETUP.md](./OPENROUTER-SETUP.md)）

```
名称: NEXT_PUBLIC_SUPABASE_URL
值: https://kqalqqnuliuszwljfosz.supabase.co
```

```
名称: SUPABASE_SERVICE_ROLE_KEY
值: eyJhbGci...(你的完整key)
```

### 步骤3: 推送代码（1分钟）

```bash
git push origin main
```

### 步骤4: 手动测试一次

1. 访问 https://github.com/你的用户名/alphaarena/actions
2. 点击左侧 **Generate Daily AI Articles**
3. 点击右上角 **Run workflow** → **Run workflow**
4. 等待2-3分钟

### ✅ 完成！

如果显示绿色✓，说明成功了！

- 系统每天早上8点（北京时间）自动运行
- 自动生成2篇AI文章
- 自动提交到GitHub
- 网站自动更新

**你什么都不用做了！🎉**

---

## 本地测试（可选）

添加到 `.env.local`:
```env
OPENROUTER_API_KEY=sk-or-v1-你的key
AI_MODEL=google/gemini-2.0-flash-exp:free
```

运行:
```bash
pnpm generate-ai-articles
```

---

## 查看生成的文章

```bash
# 最新文章
ls -lt content/articles/

# 今天的文章
cat content/articles/daily-report-$(date +%Y-%m-%d).md
```

---

## 遇到问题？

查看详细文档: [AI-AUTOMATION-SETUP.md](./AI-AUTOMATION-SETUP.md)

常见问题:
- ❌ Workflow失败 → 检查GitHub Secrets是否正确配置
- ❌ 文章未生成 → 检查Supabase数据是否存在
- ❌ API错误 → 检查OpenAI账户余额

---

**预计设置时间**: 3分钟
**月度成本**: $0-2（免费模型可用！）
**维护工作**: 0（全自动）

**详细文档**: 查看 [OPENROUTER-SETUP.md](./OPENROUTER-SETUP.md) 了解更多模型选择
