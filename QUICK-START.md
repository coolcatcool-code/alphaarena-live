# 🚀 5分钟快速启动指南

## 让文章每天自动生成并发布到网站

### 步骤1: 获取OpenAI API Key（2分钟）

1. 访问 https://platform.openai.com/api-keys
2. 登录/注册账号
3. 点击 **Create new secret key**
4. 复制key（格式：`sk-proj-xxx...`）
5. 充值至少$5（设置 → Billing）

**费用**: 每天约$0.10-0.20，每月$3-6

### 步骤2: 配置GitHub Secrets（2分钟）

1. 打开 https://github.com/你的用户名/alphaarena/settings/secrets/actions
2. 点击 **New repository secret**，添加3个secrets：

```
名称: NEXT_PUBLIC_SUPABASE_URL
值: https://kqalqqnuliuszwljfosz.supabase.co
```

```
名称: SUPABASE_SERVICE_ROLE_KEY
值: eyJhbGci...(你的完整key)
```

```
名称: OPENAI_API_KEY
值: sk-proj-...(你刚才复制的key)
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
OPENAI_API_KEY=sk-proj-你的key
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

**预计设置时间**: 5分钟
**月度成本**: $1-6
**维护工作**: 0（全自动）
