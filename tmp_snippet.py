=__import__('pathlib')\ntext=importlib.Path('scripts/complete-sync-all.py').read_text(encoding='utf-8')\nstart=text.find('INSERT OR REPLACE INTO account_totals')\nprint(text[start:start+600])
