#!/usr/bin/env python3
"""Append free Nasdaq short-interest records to GitHub-backed per-ticker files."""
import json, pathlib, urllib.request, datetime, time
root=pathlib.Path(__file__).resolve().parents[1]
universe=json.loads((root/"data/watchlist-universe.json").read_text())
folder=root/"data/short-interest"
folder.mkdir(parents=True,exist_ok=True)
def num(v):
    try:return float(str(v).replace(",","")) if v is not None and str(v).strip() else None
    except ValueError:return None
def date(v):
    for fmt in ("%m/%d/%Y","%Y-%m-%d"):
        try:return datetime.datetime.strptime(str(v),fmt).date().isoformat()
        except ValueError:pass
    return None
for ticker in dict.fromkeys(universe["tickers"]+universe.get("additionalTickers",[])):
    quote=universe.get("aliases",{}).get(ticker,{}).get("quote",ticker)
    try:
        url=f"https://api.nasdaq.com/api/quote/{quote}/short-interest?assetclass=stocks"
        req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Accept":"application/json","Origin":"https://www.nasdaq.com"})
        with urllib.request.urlopen(req,timeout=12) as response:payload=json.load(response)
        data=payload.get("data") or {}
        rows=(data.get("shortInterestTable") or {}).get("rows") or data.get("rows") or []
        path=folder/(ticker+".json")
        prior=json.loads(path.read_text()) if path.exists() else {"ticker":ticker,"observations":[]}
        points={p["date"]:p for p in prior["observations"]}
        for r in rows:
            d=date(r.get("settlementDate") or r.get("date"))
            shares=num(r.get("interest") or r.get("shortInterest") or r.get("shortInterestShares"))
            if d and shares is not None:
                points[d]={"date":d,"shares":int(shares),"days":num(r.get("daysToCover")),"percent":num(r.get("percentOfFloat")),"source":"Nasdaq"}
        if points:
            result=json.dumps({"ticker":ticker,"observations":sorted(points.values(),key=lambda p:p["date"])},indent=2)+"\n"
            if not path.exists() or path.read_text()!=result:path.write_text(result)
        print(ticker,len(points))
    except Exception as exc:print(ticker,"unavailable",str(exc)[:100])
    time.sleep(0.5)
