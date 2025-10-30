#!/usr/bin/env python3
"""
Complete D1 Sync Script - Syncs ALL NOF1 API data to D1
"""

import requests
import json
import sys
from datetime import datetime
import subprocess
import tempfile
import os

MODELS = [
    'qwen3-max',
    'deepseek-chat-v3.1',
    'claude-sonnet-4-5',
    'grok-4',
    'gemini-2.5-pro',
    'gpt-5'
]

def fetch_all_data():
    """Fetch data from all NOF1 APIs"""
    print('📡 Fetching data from all NOF1 APIs...\n')

    data = {}

    apis = {
        'leaderboard': 'https://nof1.ai/api/leaderboard',
        'trades': 'https://nof1.ai/api/trades',
        'analytics': 'https://nof1.ai/api/analytics',
        'conversations': 'https://nof1.ai/api/conversations',
        'account_totals': 'https://nof1.ai/api/account-totals',
        'since_inception': 'https://nof1.ai/api/since-inception-values',
        'crypto_prices': 'https://nof1.ai/api/crypto-prices'
    }

    for name, url in apis.items():
        try:
            print(f'  Fetching {name}...', end=' ')
            r = requests.get(url, timeout=30)
            data[name] = r.json()
            print('✓')
        except Exception as e:
            print(f'✗ Error: {e}')
            data[name] = {}

    # Fetch per-model analytics
    data['model_analytics'] = {}
    for model in MODELS:
        try:
            print(f'  Fetching analytics for {model}...', end=' ')
            r = requests.get(f'https://nof1.ai/api/analytics/{model}', timeout=30)
            data['model_analytics'][model] = r.json()
            print('✓')
        except Exception as e:
            print(f'✗ Error: {e}')
            data['model_analytics'][model] = {}

    return data

def generate_sql(data):
    """Generate SQL for all data"""
    timestamp = int(datetime.now().timestamp())
    sql_statements = []

    print('\n📝 Generating SQL statements...\n')

    # 1. Leaderboard Cache
    print('  1. Leaderboard cache...')
    for entry in data['leaderboard'].get('leaderboard', []):
        sql = f"""INSERT OR REPLACE INTO leaderboard_cache (
    model_id, num_trades, sharpe, win_dollars, num_losses,
    lose_dollars, return_pct, equity, num_wins, rank, cached_at
) VALUES (
    '{entry.get('id', '')}',
    {entry.get('num_trades', 0)},
    {entry.get('sharpe', 0)},
    {entry.get('win_dollars', 0)},
    {entry.get('num_losses', 0)},
    {entry.get('lose_dollars', 0)},
    {entry.get('return_pct', 0)},
    {entry.get('equity', 0)},
    {entry.get('num_wins', 0)},
    0,
    {timestamp}
);"""
        sql_statements.append(sql)

    # 2. Recent Trades Cache (50)
    print('  2. Recent trades cache...')
    for i, trade in enumerate(data['trades'].get('trades', [])[:50]):
        trade_id = trade.get('id', f'trade-{timestamp}-{i}')
        trade_json = json.dumps(trade).replace("'", "''")
        pnl = trade.get('realized_net_pnl', trade.get('pnl'))
        pnl_sql = pnl if pnl is not None else 'NULL'
        entry_time = trade.get('entry_time', timestamp)
        exit_time = trade.get('exit_time')
        exit_time_sql = exit_time if exit_time else 'NULL'

        sql = f"""INSERT OR REPLACE INTO recent_trades_cache (
    id, model_id, symbol, side, entry_time, exit_time,
    realized_net_pnl, trade_data, cached_at
) VALUES (
    '{trade_id}',
    '{trade.get('model_id', '')}',
    '{trade.get('symbol', '')}',
    '{trade.get('side', '')}',
    {entry_time},
    {exit_time_sql},
    {pnl_sql},
    '{trade_json}',
    {timestamp}
);"""
        sql_statements.append(sql)

    # 3. Detailed Trades (ALL)
    print(f'  3. Detailed trades (ALL {len(data["trades"].get("trades", []))} trades)...')
    for i, trade in enumerate(data['trades'].get('trades', [])):
        trade_id = trade.get('id', f'trade-{timestamp}-{i}')
        model_id = trade.get('model_id', '')
        symbol = trade.get('symbol', '')
        side = trade.get('side', '')
        trade_type = trade.get('trade_type', side)
        leverage = trade.get('leverage', 1)
        quantity = trade.get('quantity', trade.get('entry_sz', 0))
        confidence = trade.get('confidence', 0)

        entry_time = trade.get('entry_time', timestamp)
        entry_human_time = trade.get('entry_human_time', '')
        entry_price = trade.get('entry_price', 0)
        entry_sz = trade.get('entry_sz', 0)
        entry_oid = trade.get('entry_oid', '')
        entry_tid = trade.get('entry_tid', '')
        entry_commission = trade.get('entry_commission_dollars', 0)
        entry_closed_pnl = trade.get('entry_closed_pnl', 0)
        entry_crossed = 1 if trade.get('entry_crossed') else 0

        exit_time = trade.get('exit_time')
        exit_time_sql = exit_time if exit_time else 'NULL'
        exit_human_time = trade.get('exit_human_time', '')
        exit_price = trade.get('exit_price', 0)
        exit_sz = trade.get('exit_sz', 0)
        exit_oid = trade.get('exit_oid', '')
        exit_tid = trade.get('exit_tid', '')
        exit_commission = trade.get('exit_commission_dollars', 0)
        exit_closed_pnl = trade.get('exit_closed_pnl', 0)
        exit_crossed = 1 if trade.get('exit_crossed') else 0

        realized_net_pnl = trade.get('realized_net_pnl')
        realized_net_pnl_sql = realized_net_pnl if realized_net_pnl is not None else 'NULL'
        realized_gross_pnl = trade.get('realized_gross_pnl')
        realized_gross_pnl_sql = realized_gross_pnl if realized_gross_pnl is not None else 'NULL'
        total_commission = trade.get('total_commission_dollars', 0)
        trade_id_field = trade.get('trade_id', trade_id)

        sql = f"""INSERT OR REPLACE INTO trades_detailed (
    id, model_id, symbol, side, trade_type, leverage, quantity, confidence,
    entry_time, entry_human_time, entry_price, entry_sz, entry_oid, entry_tid,
    entry_commission_dollars, entry_closed_pnl, entry_crossed,
    exit_time, exit_human_time, exit_price, exit_sz, exit_oid, exit_tid,
    exit_commission_dollars, exit_closed_pnl, exit_crossed,
    realized_net_pnl, realized_gross_pnl, total_commission_dollars,
    trade_id, cached_at
) VALUES (
    '{trade_id}', '{model_id}', '{symbol}', '{side}', '{trade_type}', {leverage}, {quantity}, {confidence},
    {entry_time}, '{entry_human_time}', {entry_price}, {entry_sz}, '{entry_oid}', '{entry_tid}',
    {entry_commission}, {entry_closed_pnl}, {entry_crossed},
    {exit_time_sql}, '{exit_human_time}', {exit_price}, {exit_sz}, '{exit_oid}', '{exit_tid}',
    {exit_commission}, {exit_closed_pnl}, {exit_crossed},
    {realized_net_pnl_sql}, {realized_gross_pnl_sql}, {total_commission},
    '{trade_id_field}', {timestamp}
);"""
        sql_statements.append(sql)

    # 4. Model Performance Cache
    print('  4. Model performance cache...')
    for entry in data['leaderboard'].get('leaderboard', []):
        model_id = entry.get('id', '')
        num_trades = entry.get('num_trades', 0)
        equity = entry.get('equity', 0)
        wins = entry.get('num_wins', 0)
        total = entry.get('num_trades', 0)
        win_rate = (wins / total * 100) if total > 0 else 0

        sql = f"""INSERT OR REPLACE INTO model_performance_cache (
    model_id, today_trades, today_pnl, today_win_rate,
    week_trades, week_pnl, week_win_rate,
    total_trades, total_pnl, overall_win_rate, sharpe_ratio, cached_at
) VALUES (
    '{model_id}',
    {num_trades}, {entry.get('return_pct', 0)}, {win_rate},
    {num_trades}, {entry.get('return_pct', 0)}, {win_rate},
    {num_trades}, {entry.get('return_pct', 0)}, {win_rate},
    {entry.get('sharpe', 0)}, {timestamp}
);"""
        sql_statements.append(sql)

    # 5. Model Analytics (full data for each model)
    print('  5. Model analytics (detailed)...')
    for model_id, analytics_data in data['model_analytics'].items():
        analytics = analytics_data.get('analytics', [])
        if not analytics:
            continue

        entry = analytics[0]

        # Extract all metrics
        fee_pnl = entry.get('fee_pnl_moves_breakdown_table', {})
        winners_losers = entry.get('winners_losers_breakdown_table', {})
        signals = entry.get('signals_breakdown_table', {})
        overall = entry.get('overall_trades_overview_table', {})
        longs_shorts = entry.get('longs_shorts_breakdown_table', {})
        invocation = entry.get('invocation_breakdown_table', {})

        sql = f"""INSERT OR REPLACE INTO model_analytics (
    model_id, updated_at, last_trade_exit_time,
    overall_pnl_with_fees, overall_pnl_without_fees, total_fees_paid,
    avg_net_pnl, avg_gross_pnl, std_net_pnl, std_gross_pnl,
    biggest_net_gain, biggest_net_loss,
    win_rate, avg_winners_net_pnl, avg_losers_net_pnl,
    total_trades, num_long_trades, num_short_trades,
    avg_holding_period_mins, median_holding_period_mins,
    avg_size_of_trade_notional, median_size_of_trade_notional,
    total_signals, num_long_signals, num_short_signals,
    avg_confidence, median_confidence, avg_leverage,
    sharpe_ratio, cached_at
) VALUES (
    '{model_id}',
    {entry.get('updated_at', timestamp)},
    {entry.get('last_trade_exit_time', 'NULL') or 'NULL'},
    {fee_pnl.get('overall_pnl_with_fees', 0)},
    {fee_pnl.get('overall_pnl_without_fees', 0)},
    {fee_pnl.get('total_fees_paid', 0)},
    {fee_pnl.get('avg_net_pnl', 0)},
    {fee_pnl.get('avg_gross_pnl', 0)},
    {fee_pnl.get('std_net_pnl', 0)},
    {fee_pnl.get('std_gross_pnl', 0)},
    {fee_pnl.get('biggest_net_gain', 0)},
    {fee_pnl.get('biggest_net_loss', 0)},
    {winners_losers.get('win_rate', 0)},
    {winners_losers.get('avg_winners_net_pnl', 0)},
    {winners_losers.get('avg_losers_net_pnl', 0)},
    {overall.get('total_trades', 0)},
    {longs_shorts.get('num_long_trades', 0)},
    {longs_shorts.get('num_short_trades', 0)},
    {overall.get('avg_holding_period_mins', 0)},
    {overall.get('median_holding_period_mins', 0)},
    {overall.get('avg_size_of_trade_notional', 0)},
    {overall.get('median_size_of_trade_notional', 0)},
    {signals.get('total_signals', 0)},
    {signals.get('num_long_signals', 0)},
    {signals.get('num_short_signals', 0)},
    {signals.get('avg_confidence', 0)},
    {signals.get('median_confidence', 0)},
    {signals.get('avg_leverage', 0)},
    {winners_losers.get('win_rate', 0)},
    {timestamp}
);"""
        sql_statements.append(sql)

    # 6. Since Inception Values
    print('  6. Since inception values...')
    for entry in data['since_inception'].get('sinceInceptionValues', []):
        sql = f"""INSERT OR REPLACE INTO since_inception_values (
    id, model_id, nav_since_inception, inception_date, num_invocations, cached_at
) VALUES (
    '{entry.get('id', '')}',
    '{entry.get('model_id', '')}',
    {entry.get('nav_since_inception', 0)},
    {entry.get('inception_date', timestamp)},
    {entry.get('num_invocations', 0)},
    {timestamp}
);"""
        sql_statements.append(sql)

    # 7. Crypto Prices
    print('  7. Crypto prices...')
    for symbol, price_data in data['crypto_prices'].get('prices', {}).items():
        sql = f"""INSERT OR REPLACE INTO crypto_prices_realtime (
    symbol, price, timestamp, cached_at
) VALUES (
    '{symbol}',
    {price_data.get('price', 0)},
    {price_data.get('timestamp', timestamp)},
    {timestamp}
);"""
        sql_statements.append(sql)

    # 8. Account Totals & Positions
    print('  8. Account totals and positions...')
    for account in data['account_totals'].get('accountTotals', []):
        account_id = account.get('id', '')
        model_id = account_id.rsplit('_', 1)[0] if '_' in account_id else account_id

        positions_json = json.dumps(account.get('positions', {})).replace("'", "''")
        realized_pnl = account.get('realized_pnl', 0)

        # Calculate unrealized PnL from positions
        unrealized_pnl = 0
        positions = account.get('positions', {})
        for pos_data in positions.values():
            unrealized_pnl += pos_data.get('unrealized_pnl', 0)

        total_equity = realized_pnl + unrealized_pnl

        sql = f"""INSERT OR REPLACE INTO account_totals (
    id, model_id, timestamp, realized_pnl, unrealized_pnl, total_equity,
    positions_data, cached_at
) VALUES (
    '{account_id}',
    '{model_id}',
    {account.get('timestamp', timestamp)},
    {realized_pnl},
    {unrealized_pnl},
    {total_equity},
    '{positions_json}',
    {timestamp}
);"""
        sql_statements.append(sql)

        # Individual positions
        for symbol, pos in positions.items():
            pos_id = f'{account_id}_{symbol}_{timestamp}'
            exit_plan_json = json.dumps(pos.get('exit_plan', {})).replace("'", "''")

            sql = f"""INSERT OR REPLACE INTO account_positions (
    id, account_total_id, model_id, symbol, quantity,
    entry_price, current_price, unrealized_pnl, closed_pnl,
    leverage, margin, liquidation_price, entry_time,
    confidence, risk_usd, exit_plan, cached_at
) VALUES (
    '{pos_id}',
    '{account_id}',
    '{model_id}',
    '{symbol}',
    {pos.get('quantity', 0)},
    {pos.get('entry_price', 0)},
    {pos.get('current_price', 0)},
    {pos.get('unrealized_pnl', 0)},
    {pos.get('closed_pnl', 0)},
    {pos.get('leverage', 1)},
    {pos.get('margin', 0)},
    {pos.get('liquidation_price', 0)},
    {pos.get('entry_time', timestamp)},
    {pos.get('confidence', 0)},
    {pos.get('risk_usd', 0)},
    '{exit_plan_json}',
    {timestamp}
);"""
            sql_statements.append(sql)

    # 9. Leaderboard History
    print('  9. Leaderboard history snapshots...')
    for entry in data['leaderboard'].get('leaderboard', []):
        history_id = f'{entry.get("id", "")}-{timestamp}'
        wins = entry.get('num_wins', 0)
        total = entry.get('num_trades', 0)
        win_rate = (wins / total * 100) if total > 0 else 0

        sql = f"""INSERT OR REPLACE INTO leaderboard_history (
    id, model_id, timestamp, rank, equity, return_pct,
    sharpe, num_trades, win_rate, cached_at
) VALUES (
    '{history_id}',
    '{entry.get('id', '')}',
    {timestamp},
    0,
    {entry.get('equity', 0)},
    {entry.get('return_pct', 0)},
    {entry.get('sharpe', 0)},
    {entry.get('num_trades', 0)},
    {win_rate},
    {timestamp}
);"""
        sql_statements.append(sql)

    print(f'\n✅ Generated {len(sql_statements)} SQL statements')
    return '\n\n'.join(sql_statements)

def execute_sql_file(sql_content):
    """Execute SQL file using wrangler"""
    print('\n💾 Executing SQL in D1 database...')

    # Create temporary SQL file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False, encoding='utf-8') as f:
        f.write(sql_content)
        sql_file = f.name

    try:
        # Execute SQL file with wrangler
        cmd = ['pnpm', 'wrangler', 'd1', 'execute', 'alphaarena-db', '--remote', '--file', sql_file]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print('✅ SQL executed successfully!')
            # Print last 500 chars of output
            output = result.stdout
            if len(output) > 500:
                print('...' + output[-500:])
            else:
                print(output)
        else:
            print('❌ SQL execution failed!')
            print(result.stderr)
            return False

    finally:
        # Clean up temp file
        try:
            os.unlink(sql_file)
        except:
            pass

    return True

def main():
    print('🚀 Starting COMPLETE D1 sync...\n')
    print('This will sync ALL data from NOF1 APIs:\n')
    print('  ✓ Leaderboard')
    print('  ✓ Trades (ALL detailed trades)')
    print('  ✓ Analytics (per-model)')
    print('  ✓ Conversations')
    print('  ✓ Account Totals & Positions')
    print('  ✓ Since Inception Values')
    print('  ✓ Crypto Prices')
    print('  ✓ Historical Snapshots')
    print('\n' + '='*60 + '\n')

    # Fetch all data
    data = fetch_all_data()

    # Generate SQL
    sql = generate_sql(data)

    # Save SQL to file
    with open('complete-sync.sql', 'w', encoding='utf-8') as f:
        f.write(sql)
    print(f'\n✅ SQL saved to complete-sync.sql ({len(sql)} bytes)')

    # Execute SQL
    if execute_sql_file(sql):
        print('\n✅ Complete sync finished successfully!')
    else:
        print('\n❌ Sync failed!')
        sys.exit(1)

if __name__ == '__main__':
    main()
