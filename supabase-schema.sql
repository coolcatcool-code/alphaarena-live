-- Alpha Arena Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Models Table
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  avatar TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Snapshots Table
CREATE TABLE IF NOT EXISTS ai_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ai_model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  current_pnl DECIMAL(10, 2) NOT NULL,
  total_assets DECIMAL(10, 2) NOT NULL,
  open_positions INTEGER NOT NULL,
  win_rate DECIMAL(5, 2) NOT NULL,
  rank INTEGER NOT NULL,
  rank_change INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for ai_snapshots
CREATE INDEX IF NOT EXISTS idx_ai_snapshots_timestamp ON ai_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_snapshots_ai_model_timestamp ON ai_snapshots(ai_model_id, timestamp DESC);

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ai_model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- BUY, SELL, CLOSE
  symbol TEXT NOT NULL,
  side TEXT, -- LONG, SHORT
  amount DECIMAL(15, 2) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  leverage INTEGER DEFAULT 1,
  pnl DECIMAL(15, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for trades
CREATE INDEX IF NOT EXISTS idx_trades_ai_model_timestamp ON trades(ai_model_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);

-- Insert initial AI models
INSERT INTO ai_models (name, description, color) VALUES
  ('Claude Sonnet', 'Anthropic AI - Conservative value investing approach', '#3B82F6'),
  ('DeepSeek', 'Open-source model - Aggressive momentum trading strategy', '#10B981'),
  ('ChatGPT', 'OpenAI - Balanced multi-asset strategy', '#8B5CF6'),
  ('Gemini', 'Google AI - Reactive trading with high frequency', '#EF4444'),
  ('Grok', 'xAI - High-frequency scalping attempts', '#F59E0B'),
  ('Qwen', 'Alibaba Cloud - Medium swing trading', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ai_models
DROP TRIGGER IF EXISTS update_ai_models_updated_at ON ai_models;
CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
