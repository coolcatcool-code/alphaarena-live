#!/usr/bin/env python3
"""
Batch sync data from NOF1 API to Cloudflare D1 database
This script generates a single SQL file with all INSERT statements
"""

import requests
import json
import sys
from datetime import datetime
import subprocess
import tempfile
import os

def fetch_nof1_data():
    """Fetch data from NOF1 API"""
    print("📡 Fetching data from NOF1.ai...")

    try:
        leaderboard = requests.get('https://nof1.ai/api/leaderboard', timeout=30).json()
        trades = requests.get('https://nof1.ai/api/trades', timeout=30).json()
        analytics = requests.get('https://nof1.ai/api/analytics', timeout=30).json()

        return {
            'leaderboard': leaderboard.get('leaderboard', []),
            'trades': trades.get('trades', [])[:100],  # Recent 100 trades
            'analytics': analytics.get('analytics', [])
        }
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        sys.exit(1)

def generate_sql(data):
    """Generate SQL statements for all data"""
    timestamp = int(datetime.now().timestamp())
    sql_statements = []

    # Leaderboard Cache
    print(f"📊 Generating SQL for {len(data['leaderboard'])} leaderboard entries...")
    for entry in data['leaderboard']:
        sql = f"""INSERT OR REPLACE INTO leaderboard_cache (
    model_id, num_trades, sharpe, win_dollars, num_losses,
    lose_dollars, return_pct, equity, num_wins, rank, cached_at
) VALUES (
    '{entry.get("aiModelId", "")}',
    {entry.get("totalTrades", 0)},
    {entry.get("sharpeRatio", 0)},
    {entry.get("winDollars", 0)},
    {entry.get("numLosses", 0)},
    {entry.get("loseDollars", 0)},
    {entry.get("returnPct", 0)},
    {entry.get("totalAssets", 0)},
    {entry.get("numWins", 0)},
    {entry.get("rank", 0)},
    {timestamp}
);"""
        sql_statements.append(sql)

    # Recent Trades Cache (limit to 50 most recent)
    print(f"💱 Generating SQL for {min(len(data['trades']), 50)} recent trades...")
    for i, trade in enumerate(data['trades'][:50]):
        trade_id = trade.get('id', f'trade-{int(datetime.now().timestamp() * 1000)}-{i}')
        trade_json = json.dumps(trade).replace("'", "''")
        pnl_value = trade.get('realizedNetPnl', trade.get('pnl'))
        pnl_sql = pnl_value if pnl_value is not None else 'NULL'

        sql = f"""INSERT OR REPLACE INTO recent_trades_cache (
    id, model_id, symbol, side, entry_time, exit_time,
    realized_net_pnl, trade_data, cached_at
) VALUES (
    '{trade_id}',
    '{trade.get("aiModelId", "")}',
    '{trade.get("symbol", "")}',
    '{trade.get("side", "")}',
    {trade.get("entryTime", timestamp)},
    {trade.get("exitTime", "NULL") if trade.get("exitTime") else "NULL"},
    {pnl_sql},
    '{trade_json}',
    {timestamp}
);"""
        sql_statements.append(sql)

    # Model Performance Cache
    print(f"📈 Generating SQL for {len(data['leaderboard'])} model performance entries...")
    for entry in data['leaderboard']:
        total_trades = entry.get("totalTrades", 0)
        win_rate = entry.get("winRate", 0)

        sql = f"""INSERT OR REPLACE INTO model_performance_cache (
    model_id, today_trades, today_pnl, today_win_rate,
    week_trades, week_pnl, week_win_rate,
    total_trades, total_pnl, overall_win_rate, sharpe_ratio, cached_at
) VALUES (
    '{entry.get("aiModelId", "")}',
    {total_trades},
    {entry.get("totalPnL", 0)},
    {win_rate},
    {total_trades},
    {entry.get("totalPnL", 0)},
    {win_rate},
    {total_trades},
    {entry.get("totalPnL", 0)},
    {win_rate},
    {entry.get("sharpeRatio", 0)},
    {timestamp}
);"""
        sql_statements.append(sql)

    return "\n\n".join(sql_statements)

def execute_sql_file(sql_content):
    """Execute SQL file using wrangler"""
    print("\n💾 Executing SQL in D1 database...")

    # Create temporary SQL file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
        f.write(sql_content)
        sql_file = f.name

    try:
        # Execute SQL file with wrangler
        cmd = ['npx', 'wrangler', 'd1', 'execute', 'alphaarena-db', '--remote', '--file', sql_file]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print("✅ SQL executed successfully!")
            print(result.stdout)
        else:
            print("❌ SQL execution failed!")
            print(result.stderr)
            return False

    finally:
        # Clean up temp file
        try:
            os.unlink(sql_file)
        except:
            pass

    return True

def verify_data():
    """Verify data in D1"""
    print("\n🔍 Verifying data...")

    queries = [
        ('snapshots', 'SELECT COUNT(*) as count FROM snapshots;'),
        ('trades', 'SELECT COUNT(*) as count FROM trades;'),
        ('analytics', 'SELECT COUNT(*) as count FROM analytics;'),
    ]

    for table, query in queries:
        try:
            cmd = ['npx', 'wrangler', 'd1', 'execute', 'alphaarena-db', '--remote', '--command', query]
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                print(f"  {table}: {result.stdout.strip()}")
            else:
                print(f"  {table}: Error querying")

        except Exception as e:
            print(f"  {table}: {e}")

def main():
    print("🚀 Starting D1 batch sync...\n")

    # Fetch data
    data = fetch_nof1_data()

    print(f"\n✅ Fetched:")
    print(f"  - {len(data['leaderboard'])} leaderboard entries")
    print(f"  - {len(data['trades'])} trades")
    print(f"  - {len(data['analytics'])} analytics entries")

    # Generate SQL
    print("\n📝 Generating SQL statements...")
    sql = generate_sql(data)

    # Save SQL to file for review
    with open('sync-d1.sql', 'w') as f:
        f.write(sql)
    print(f"✅ SQL saved to sync-d1.sql ({len(sql)} bytes)")

    # Execute SQL
    if execute_sql_file(sql):
        verify_data()
        print("\n✅ Sync completed successfully!")
    else:
        print("\n❌ Sync failed!")
        sys.exit(1)

if __name__ == '__main__':
    main()
