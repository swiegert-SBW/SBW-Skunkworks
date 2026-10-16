"""Refresh the static US-listed symbol/company directory from Nasdaq Trader."""
import csv
import io
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "data" / "ticker-company-names.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (SBW Workstation symbol directory)"}
SOURCES = [
    ("https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt", "Symbol", "Security Name"),
    ("https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt", "ACT Symbol", "Security Name"),
]
names = {}
for url, symbol_col, name_col in SOURCES:
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=35) as response:
        text = response.read().decode("utf-8-sig")
    rows = csv.DictReader(io.StringIO(text), delimiter="|")
    found = 0
    for row in rows:
        ticker = (row.get(symbol_col) or "").strip().upper().replace(".", "-")
        name = (row.get(name_col) or "").strip()
        if not ticker or not name or ticker.startswith("FILE CREATION TIME"):
            continue
        if (row.get("Test Issue") or "").strip().upper() == "Y":
            continue
        names[ticker] = name
        found += 1
    if found < 1000:
        raise RuntimeError(f"Suspiciously small directory from {url}: {found} rows")
if len(names) < 5000:
    raise RuntimeError(f"Refusing to overwrite directory with only {len(names)} symbols")
# Keep historical aliases and locally curated names for symbols absent from the new listings.
previous = json.loads(DEST.read_text()) if DEST.exists() else {}
for ticker, name in previous.items():
    names.setdefault(ticker, name)
for ticker, name in list(names.items()):
    names.setdefault(ticker.replace("-", ""), name)
DEST.write_text(json.dumps(dict(sorted(names.items())), indent=2, ensure_ascii=False) + "\n")
print(f"Saved {len(names)} ticker/name mappings")
