#!/usr/bin/env python3
"""Refresh verified market caps from yfinance. Never invent missing values."""
import json
import pathlib
import time
import datetime
import io
import requests
import pandas as pd
import yfinance as yf

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "market-caps.json"
HEADERS = {"User-Agent": "SBW-Skunkworks/1.0 research contact via GitHub"}
def constituents():
    tickers = set()
    tables = pd.read_html("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies")
    tickers.update(tables[0]["Symbol"].astype(str))
    try:
        for table in pd.read_html("https://en.wikipedia.org/wiki/Nasdaq-100"):
            col = next((c for c in table.columns if str(c).lower() in ("ticker", "symbol")), None)
            if col is not None and len(table) >= 95:
                tickers.update(table[col].astype(str))
                break
    except Exception as exc:
        print("Nasdaq constituents unavailable:", exc)
    try:
        url = "https://www.ishares.com/us/products/239710/ishares-russell-2000-etf/1467271812596.ajax?fileType=csv&fileName=IWM_holdings&dataType=fund"
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        lines = response.text.splitlines()
        start = next(i for i, line in enumerate(lines) if line.lstrip().startswith("Ticker,") or line.lstrip().startswith('"Ticker",'))
        holdings = pd.read_csv(io.StringIO("\n".join(lines[start:])), on_bad_lines="skip")
        tickers.update(holdings["Ticker"].dropna().astype(str))
    except Exception as exc:
        print("Russell constituents unavailable:", exc)
    return sorted({t.strip().upper().replace(".", "-") for t in tickers if isinstance(t, str) and t.strip().replace(".", "").replace("-", "").isalnum() and len(t.strip()) <= 12})

def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    records = dict(old.get("caps", {}))
    symbols = constituents()
    print(f"Fetching market cap for {len(symbols)} symbols")
    refreshed = 0
    for i, symbol in enumerate(symbols, 1):
        try:
            ticker = yf.Ticker(symbol)
            cap = ticker.get_info().get("marketCap")
            if isinstance(cap, (int, float)) and cap > 0:
                records[symbol] = int(cap)
                refreshed += 1
        except Exception as exc:
            print(f"{symbol}: {str(exc)[:100]}")
        if i % 25 == 0:
            print(f"{i}/{len(symbols)} processed; {refreshed} fresh caps", flush=True)
            time.sleep(3)
    records = {key: value for key, value in records.items() if key in symbols and isinstance(value, int) and value > 0}
    if len(records) < 400:
        raise RuntimeError(f"Only {len(records)} verified caps; refusing to publish incomplete dataset")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "source": "yfinance", "caps": records}, separators=(",", ":"), sort_keys=True) + "\n")
    print(f"Saved {len(records)} verified market caps ({refreshed} refreshed)")

if __name__ == "__main__":
    main()
