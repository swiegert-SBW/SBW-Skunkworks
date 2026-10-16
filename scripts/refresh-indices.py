#!/usr/bin/env python3
"""Refresh complete index snapshots with source-attributed, non-estimated market caps."""
import csv, io, json, re, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from html import unescape
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]/"data"/"indices"
ROOT.mkdir(parents=True,exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36","Accept":"application/json,text/html,*/*"}
def get(url):
    for attempt in range(4):
        try:
            req=urllib.request.Request(url,headers=UA)
            with urllib.request.urlopen(req,timeout=35) as response:return response.read()
        except Exception:
            if attempt==3:raise
            time.sleep(2**attempt)
def symbol(s):
    return str(s).strip().upper().replace(".","-")
def clean(s):
    return re.sub(r"\\s+"," ",str(s or "").strip())
def from_wikipedia(url,table_id):
    html=get(url).decode("utf-8")
    frames=pd.read_html(io.StringIO(html),attrs={"id":table_id})
    if not frames:raise RuntimeError("Index table missing: "+table_id)
    return frames[0]
sp=from_wikipedia("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies","constituents")
sp_rows=[{"ticker":symbol(r["Symbol"]),"name":clean(r["Security"]),"sector":clean(r["GICS Sector"]),"industry":clean(r["GICS Sub-Industry"])} for _,r in sp.iterrows()]
dow=from_wikipedia("https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average","constituents")
print("Dow columns",list(dow.columns))
def col(df,*candidates):
    cols={str(c).lower().strip():c for c in df.columns}
    for c in candidates:
        if c.lower() in cols:return cols[c.lower()]
    raise RuntimeError("Missing required column: "+str(candidates))
dow_rows=[{"ticker":symbol(r[col(dow,"Symbol")]),"name":clean(r[col(dow,"Company")]),"sector":clean(r[col(dow,"Industry","Sector")]),"industry":clean(r[col(dow,"Industry","Sector")])} for _,r in dow.iterrows()]
iwm=get("https://www.ishares.com/us/products/239710/ishares-russell-2000-etf/1467271812596.ajax?fileType=csv&fileName=IWM_holdings&dataType=fund").decode("utf-8-sig")
lines=iwm.splitlines()
start=next((i for i,line in enumerate(lines) if line.startswith("Ticker,") or line.startswith('"Ticker",')),None)
if start is None:raise RuntimeError("IWM holdings CSV header missing")
holdings=list(csv.DictReader(io.StringIO("\\n".join(lines[start:]))))
russ=[]
for row in holdings:
    t=symbol(row.get("Ticker",""))
    asset=(row.get("Asset Class") or "").lower()
    if not re.fullmatch(r"[A-Z][A-Z0-9-]{0,11}",t) or ("equity" not in asset and asset):continue
    russ.append({"ticker":t,"name":clean(row.get("Name")),"sector":clean(row.get("Sector")),"industry":clean(row.get("Sector"))})
if len(sp_rows)<490 or len(dow_rows)!=30 or len(russ)<1800:
    raise RuntimeError(f"Incomplete constituents: S&P {len(sp_rows)}, Dow {len(dow_rows)}, IWM {len(russ)}")
# Nasdaq supplies reported market capitalization for US-listed equities.
nasdaq=json.loads(get("https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=6000&offset=0").decode("utf-8"))
rows=nasdaq.get("data",{}).get("table",{}).get("rows",[])
if len(rows)<3000:raise RuntimeError("Nasdaq cap dataset incomplete")
def cap(s):
    s=str(s or "").replace(",","").replace("$","").strip()
    if not s or s in ("N/A","--"):return None
    try:
        multiplier={"K":1e3,"M":1e6,"B":1e9,"T":1e12}
        return int(float(s[:-1])*multiplier[s[-1].upper()]) if s[-1].upper() in multiplier else int(float(s))
    except (ValueError,OverflowError):return None
caps={symbol(r.get("symbol","")):cap(r.get("marketCap")) for r in rows}
stamp=datetime.now(timezone.utc).isoformat()
for key,source,items in [("sp500","Wikipedia S&P 500 constituents",sp_rows),("djia","Wikipedia Dow Jones Industrial Average constituents",dow_rows),("russell2000","iShares IWM ETF equity holdings (Russell 2000 proxy)",russ)]:
    seen=set();out=[]
    for r in items:
        t=r["ticker"]
        if t in seen:continue
        seen.add(t)
        out.append({**r,"marketCap":caps.get(t),"marketCapSource":"Nasdaq public stock screener" if caps.get(t) is not None else None})
    if key=="sp500" and len(out)<490:raise RuntimeError("Incomplete S&P 500")
    if key=="djia" and len(out)!=30:raise RuntimeError("Incomplete DJIA")
    if key=="russell2000" and len(out)<1800:raise RuntimeError("Incomplete IWM proxy")
    payload={"index":key,"asOf":stamp,"constituentSource":source,"marketCapSource":"Nasdaq public stock screener","count":len(out),"missingMarketCaps":sum(r["marketCap"] is None for r in out),"constituents":out}
    (ROOT/(key+".json")).write_text(json.dumps(payload,separators=(",",":"),ensure_ascii=False)+"\\n")
    print(key,len(out),"missing market caps",payload["missingMarketCaps"])
