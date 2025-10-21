# Supabase 集成指南

本项目已集成 Supabase 作为数据库和后端服务。

## 🚀 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project"
3. 填写项目信息：
   - Project name: `alphaarena` (或其他名称)
   - Database Password: 设置一个强密码（请保存好）
   - Region: 选择离你最近的区域
4. 等待项目创建完成（约2分钟）

### 2. 获取环境变量

#### 数据库连接字符串

在 Supabase 项目中:
1. 进入 `Settings` → `Database`
2. 找到 "Connection string" 部分
3. 复制 **Connection pooling** 的 URI (用于 `DATABASE_URL`)
4. 复制 **Direct connection** 的 URI (用于 `DIRECT_URL`)
5. 将 `[YOUR-PASSWORD]` 替换为你的数据库密码

#### API 密钥

在 Supabase 项目中:
1. 进入 `Settings` → `API`
2. 找到 "Project API keys" 部分
3. 复制 `anon public` 密钥 (用于 `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. 复制 `service_role secret` 密钥 (用于 `SUPABASE_SERVICE_ROLE_KEY`)
5. 复制 `Project URL` (用于 `NEXT_PUBLIC_SUPABASE_URL`)

### 3. 配置环境变量

将 `.env.example` 复制为 `.env.local`:

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填入你的 Supabase 配置:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase API keys
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

### 4. 运行数据库迁移

使用 Prisma 将数据库架构同步到 Supabase:

```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 推送数据库架构到 Supabase (开发环境)
pnpm prisma db push

# 或者运行迁移 (生产环境推荐)
pnpm prisma migrate deploy
```

### 5. 验证连接

启动开发服务器并检查是否正常工作:

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看应用是否正常运行。

## 📚 使用方式

### Prisma (ORM)

用于数据库查询和操作：

```typescript
import { prisma } from '@/lib/database/client'

// 查询示例
const aiModels = await prisma.aiModel.findMany()

// 创建示例
const newModel = await prisma.aiModel.create({
  data: {
    name: 'Claude',
    description: 'Anthropic AI',
  }
})
```

### Supabase Client (其他功能)

用于认证、存储、实时订阅等：

```typescript
import { supabase } from '@/lib/database/client'

// 实时订阅示例
const channel = supabase
  .channel('ai-snapshots')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'ai_snapshots' },
    (payload) => console.log('New snapshot:', payload)
  )
  .subscribe()

// 文件上传示例
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('avatar.png', file)
```

## 🔒 安全最佳实践

1. **永远不要提交 `.env.local` 文件到 Git**
2. **SERVICE_ROLE_KEY 只在服务器端使用**，永远不要暴露给客户端
3. **启用 Row Level Security (RLS)**：
   - 在 Supabase Dashboard 中为每个表启用 RLS
   - 创建适当的安全策略

### 启用 RLS 示例

在 Supabase SQL Editor 中运行：

```sql
-- 为 ai_models 表启用 RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- 创建只读策略（公开读取）
CREATE POLICY "Allow public read access" ON ai_models
  FOR SELECT USING (true);

-- 创建管理员写入策略（需要 service_role）
CREATE POLICY "Allow service role full access" ON ai_models
  FOR ALL USING (auth.role() = 'service_role');
```

## 🛠️ 常用 Prisma 命令

```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 推送架构到数据库（开发环境）
pnpm prisma db push

# 创建迁移
pnpm prisma migrate dev --name migration_name

# 应用迁移（生产环境）
pnpm prisma migrate deploy

# 打开 Prisma Studio（数据库可视化界面）
pnpm prisma studio

# 重置数据库（危险！会删除所有数据）
pnpm prisma migrate reset
```

## 🚀 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 在 Vercel 项目设置中添加环境变量：
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. 部署！

## 📊 监控和日志

在 Supabase Dashboard 中查看：
- **Database** → 数据库性能和连接
- **Logs** → 查询日志和错误
- **Reports** → 使用情况报告

## 🆘 故障排除

### 连接问题

如果遇到连接错误：
1. 检查 `.env.local` 中的密码是否正确
2. 确认项目引用 `[PROJECT-REF]` 是否正确
3. 检查区域 `[REGION]` 是否匹配

### 迁移问题

如果 `prisma db push` 失败：
1. 使用 `DIRECT_URL` 而不是 `DATABASE_URL`
2. 确保 connection pooling 参数正确：`?pgbouncer=true`

### Prisma 错误

```bash
# 清除 Prisma 缓存并重新生成
rm -rf node_modules/.prisma
pnpm prisma generate
```

## 📝 更多资源

- [Supabase 文档](https://supabase.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js + Supabase 指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
