-- Cloudflare D1 数据库 Schema
-- 用于边缘缓存，存储热数据

-- ========================================
-- 1. 排行榜缓存表
-- ========================================
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  model_id TEXT PRIMARY KEY,
  num_trades INTEGER NOT NULL,
  sharpe REAL,
  win_dollars REAL,
  num_losses INTEGER,
  lose_dollars REAL,
  return_pct REAL,
  equity REAL,
  num_wins INTEGER,
  rank INTEGER,
  cached_at INTEGER NOT NULL
);

-- ========================================
-- 2. 最新交易缓存表（只保留最近100条）
-- ========================================
CREATE TABLE IF NOT EXISTS recent_trades_cache (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  entry_time INTEGER NOT NULL,
  exit_time INTEGER,
  realized_net_pnl REAL,
  trade_data TEXT NOT NULL, -- JSON字符串，包含完整交易信息
  cached_at INTEGER NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_recent_trades_time ON recent_trades_cache(entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_recent_trades_model ON recent_trades_cache(model_id);
CREATE INDEX IF NOT EXISTS idx_recent_trades_cached ON recent_trades_cache(cached_at DESC);

-- ========================================
-- 3. 每日统计缓存表
-- ========================================
CREATE TABLE IF NOT EXISTS daily_stats_cache (
  date TEXT PRIMARY KEY, -- YYYY-MM-DD格式
  total_trades INTEGER DEFAULT 0,
  total_pnl REAL DEFAULT 0,
  best_performer TEXT,
  best_performer_return REAL,
  worst_performer TEXT,
  worst_performer_return REAL,
  total_volume REAL,
  avg_trade_duration INTEGER, -- 秒
  cached_at INTEGER NOT NULL
);

-- ========================================
-- 4. 模型性能快照（每小时更新）
-- ========================================
CREATE TABLE IF NOT EXISTS model_performance_cache (
  model_id TEXT PRIMARY KEY,
  -- 今日统计
  today_trades INTEGER DEFAULT 0,
  today_pnl REAL DEFAULT 0,
  today_win_rate REAL,
  -- 本周统计
  week_trades INTEGER DEFAULT 0,
  week_pnl REAL DEFAULT 0,
  week_win_rate REAL,
  -- 总体统计
  total_trades INTEGER DEFAULT 0,
  total_pnl REAL DEFAULT 0,
  overall_win_rate REAL,
  sharpe_ratio REAL,
  cached_at INTEGER NOT NULL
);

-- ========================================
-- 5. 实时价格缓存
-- ========================================
CREATE TABLE IF NOT EXISTS crypto_prices_cache (
  symbol TEXT PRIMARY KEY,
  price REAL NOT NULL,
  change_24h REAL,
  volume_24h REAL,
  cached_at INTEGER NOT NULL
);
