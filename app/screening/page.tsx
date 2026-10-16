"use client";
import {useEffect,useMemo,useState} from "react";
type Item=Record<string,unknown>;
type Field={key:string;label:string;kind?:"number"|"select";unit?:"percent"|"money";options?:string[];available?:boolean};
const fields:Field[]=[
 {key:"exchange",label:"Exchange",kind:"select",options:["XNAS","XNYS","XASE","ARCX"]},
 {key:"index",label:"Index",available:false},{key:"sector",label:"Sector",available:false},{key:"industry",label:"Industry",available:false},{key:"country",label:"Country",available:false},
 {key:"market_cap",label:"Market Cap.",unit:"money"},{key:"price_to_earnings",label:"P/E"},{key:"forward_pe",label:"Forward P/E",available:false},{key:"peg",label:"PEG",available:false},{key:"price_to_sales",label:"P/S"},
 {key:"price_to_book",label:"P/B"},{key:"price_to_cash_flow",label:"Price/Cash Flow"},{key:"price_to_free_cash_flow",label:"Price/Free Cash Flow"},{key:"ev_to_ebitda",label:"EV/EBITDA"},{key:"ev_to_sales",label:"EV/Sales"},
 {key:"dividend_growth",label:"Dividend Growth",available:false},{key:"eps_growth_this_year",label:"EPS Growth This Year",available:false},{key:"eps_growth_next_year",label:"EPS Growth Next Year",available:false},{key:"eps_growth_qoq",label:"EPS Growth Qtr Over Qtr",available:false},{key:"eps_growth_ttm",label:"EPS Growth TTM",available:false},
 {key:"eps_growth_3y",label:"EPS Growth Past 3 Years",available:false},{key:"eps_growth_5y",label:"EPS Growth Past 5 Years",available:false},{key:"eps_growth_next_5y",label:"EPS Growth Next 5 Years",available:false},{key:"sales_growth_qoq",label:"Sales Growth Qtr Over Qtr",available:false},{key:"sales_growth_ttm",label:"Sales Growth TTM",available:false},
 {key:"sales_growth_3y",label:"Sales Growth Past 3 Years",available:false},{key:"sales_growth_5y",label:"Sales Growth Past 5 Years",available:false},{key:"surprise",label:"Earnings & Revenue Surprise",available:false},{key:"dividend_yield",label:"Dividend Yield",unit:"percent"},{key:"return_on_assets",label:"Return on Assets",unit:"percent"},
 {key:"return_on_equity",label:"Return on Equity",unit:"percent"},{key:"roic",label:"Return on Invested Capital",available:false},{key:"current",label:"Current Ratio"},{key:"quick",label:"Quick Ratio"},{key:"long_term_debt_equity",label:"LT Debt/Equity",available:false},
 {key:"debt_to_equity",label:"Debt/Equity"},{key:"gross_margin",label:"Gross Margin",available:false},{key:"operating_margin",label:"Operating Margin",available:false},{key:"net_margin",label:"Net Profit Margin",available:false},{key:"payout_ratio",label:"Payout Ratio",available:false},
 {key:"insider_ownership",label:"Insider Ownership",available:false},{key:"insider_transactions",label:"Insider Transactions",available:false},{key:"institutional_ownership",label:"Institutional Ownership",available:false},{key:"institutional_transactions",label:"Institutional Transactions",available:false},{key:"short_float",label:"Short Float",available:false},
 {key:"analyst_recommendation",label:"Analyst Recommendation",available:false},{key:"option_short",label:"Option/Short",available:false},{key:"earnings_date",label:"Earnings Date",available:false},{key:"performance",label:"Performance",available:false},{key:"performance_2",label:"Performance 2",available:false},
 {key:"volatility",label:"Volatility",available:false},{key:"rsi",label:"RSI (14)",available:false},{key:"gap",label:"Gap",available:false},{key:"sma20",label:"20-Day Simple Moving Average",available:false},{key:"sma50",label:"50-Day Simple Moving Average",available:false},
 {key:"sma200",label:"200-Day Simple Moving Average",available:false},{key:"change",label:"Change",available:false},{key:"change_open",label:"Change from Open",available:false},{key:"highlow20",label:"20-Day High/Low",available:false},{key:"highlow50",label:"50-Day High/Low",available:false},
 {key:"highlow52",label:"52-Week High/Low",available:false},{key:"ath",label:"All-Time High/Low",available:false},{key:"pattern",label:"Pattern",available:false},{key:"candlestick",label:"Candlestick",available:false},{key:"beta",label:"Beta",available:false},
 {key:"atr",label:"Average True Range",available:false},{key:"average_volume",label:"Average Volume"},{key:"relative_volume",label:"Relative Volume",available:false},{key:"current_volume",label:"Current Volume",available:false},{key:"trades",label:"Trades",available:false},
 {key:"price",label:"Price $"},{key:"target_price",label:"Target Price",available:false},{key:"ipo_date",label:"IPO Date",available:false},{key:"shares_outstanding",label:"Shares Outstanding",available:false},{key:"float",label:"Float",available:false}
];
type Preset={label:string;min?:number;max?:number};
const threshold=(values:number[],unit="") :Preset[]=>[
 ...values.map(v=>({label:"Over "+v+unit,min:v})),
 ...values.map(v=>({label:"Under "+v+unit,max:v}))
];
const presets=(f:Field):Preset[]=>{
 if(f.key==="market_cap")return [
 {label:"Mega ($200B+)",min:200},{label:"Large ($10B–$200B)",min:10,max:200},
 {label:"Mid ($2B–$10B)",min:2,max:10},{label:"Small ($300M–$2B)",min:.3,max:2},
 {label:"Micro ($50M–$300M)",min:.05,max:.3},{label:"Nano (under $50M)",max:.05},
 {label:"Over $2B",min:2},{label:"Over $10B",min:10},{label:"Under $50B",max:50},
 {label:"$2B–$50B",min:2,max:50}];
 if(f.key==="price")return [{label:"Under $1",max:1},{label:"$1–$5",min:1,max:5},{label:"$5–$10",min:5,max:10},{label:"$10–$50",min:10,max:50},{label:"$50–$100",min:50,max:100},{label:"Over $100",min:100}];
 if(f.key==="average_volume")return [{label:"Over 50K",min:50000},{label:"Over 100K",min:100000},{label:"Over 500K",min:500000},{label:"Over 1M",min:1000000},{label:"Over 5M",min:5000000}];
 if(f.unit==="percent")return threshold([0,5,10,15,20,25,30,40,50],"%");
 if(["current","quick","debt_to_equity"].includes(f.key))return threshold([.5,1,1.5,2,3,5]);
 return threshold([0,5,10,15,20,25,30,40,50]);
};
const columns=[["ticker","Ticker"],["price","Price"],["market_cap","Market Cap"],["price_to_earnings","P/E"],["price_to_sales","P/S"],["price_to_book","P/B"],["ev_to_ebitda","EV/EBITDA"],["return_on_equity","ROE"],["return_on_assets","ROA"],["debt_to_equity","D/E"],["dividend_yield","Div. Yield"],["free_cash_flow","FCF"]];
const format=(v:unknown,key:string)=>{if(typeof v!=="number"||!Number.isFinite(v))return "—";if(key==="market_cap"||key==="free_cash_flow")return Math.abs(v)>=1e12?(v/1e12).toFixed(2)+"T":Math.abs(v)>=1e9?(v/1e9).toFixed(2)+"B":Math.abs(v)>=1e6?(v/1e6).toFixed(1)+"M":v.toLocaleString();if(["return_on_equity","return_on_assets","dividend_yield"].includes(key))return (v*100).toFixed(2)+"%";return v.toLocaleString(undefined,{maximumFractionDigits:2})};
export default function ScreeningPage(){
 const [filters,setFilters]=useState<Record<string,string>>({}),[mode,setMode]=useState<"ratios"|"reference">("ratios"),[ticker,setTicker]=useState(""),[rows,setRows]=useState<Item[]>([]),[cursor,setCursor]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[sort,setSort]=useState("ticker"),[descending,setDescending]=useState(false),[requested,setRequested]=useState(false);
 const active=fields.filter(f=>{const v=filters[f.key]||"";return v!==""&&(f.available!==false)}).length;
 const load=async(next?:string,selectedMode=mode)=>{
  setBusy(true);setError("");setNotice("");
  try{
   const params=new URLSearchParams({mode:selectedMode});
   if(ticker.trim())params.set("ticker",ticker.trim().toUpperCase());
   if(next)params.set("cursor",next);
   if(selectedMode==="ratios")for(const field of fields){
    if(field.available===false||field.kind==="select")continue;
    const selection=filters[field.key]||"";
    if(!selection)continue;
    const preset=selection==="custom"?null:presets(field)[Number(selection)];
    const limits=selection==="custom"?{min:filters[field.key+":gte"],max:filters[field.key+":lte"]}:preset?{min:preset.min,max:preset.max}:null;
    if(!limits)continue;
    for(const [side,op] of [["min","gte"],["max","lte"]] as const){
     const v=limits[side];if(v===undefined||v==="")continue;
     const n=Number(v);if(!Number.isFinite(n))continue;
     params.set(field.key+"."+op,String(field.unit==="percent"?n/100:field.unit==="money"?n*1e9:n));
    }
   }
   if(selectedMode==="reference"&&filters.exchange)params.set("exchange",filters.exchange);
   const res=await fetch("/api/screening?"+params,{cache:"no-store"});const json=await res.json();
   if(!res.ok)throw Error(json.error||"Request failed");
   setRows(prev=>next?[...prev,...json.results]:json.results);setCursor(json.nextCursor||null);setRequested(true);
   setNotice(selectedMode==="ratios"?"Financials & Ratios data, updated end of day.":"Reference universe. Financial filters are not applied in this mode.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to retrieve screening data");if(!next)setRows([])}
  finally{setBusy(false)}
 };
 const sorted=useMemo(()=>[...rows].sort((a,b)=>{const av=a[sort],bv=b[sort];const cmp=typeof av==="number"&&typeof bv==="number"?av-bv:String(av??"").localeCompare(String(bv??""));return descending?-cmp:cmp}),[rows,sort,descending]);
 const update=(key:string,value:string)=>setFilters(prev=>({...prev,[key]:value}));
 const filterCell=(f:Field)=>{
  const unavailable=f.available===false||(mode==="reference"&&f.kind!=="select");
  if(f.kind==="select")return <select aria-label={f.label} value={filters[f.key]||""} disabled={unavailable} onChange={e=>update(f.key,e.target.value)}><option value="">Any</option>{(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>;
  const options=presets(f),selection=filters[f.key]||"";
  return <div className="screen-filter-control"><select aria-label={f.label} value={selection} disabled={unavailable} onChange={e=>update(f.key,e.target.value)}><option value="">Any</option>{options.map((o,i)=><option key={i} value={String(i)}>{o.label}</option>)}<option value="custom">Custom range…</option></select>{selection==="custom"&&!unavailable&&<div className="screen-range">{(["gte","lte"] as const).map(op=><input key={op} aria-label={f.label+" "+(op==="gte"?"minimum":"maximum")} type="number" step="any" placeholder={op==="gte"?"Min":"Max"} value={filters[f.key+":"+op]||""} onChange={e=>update(f.key+":"+op,e.target.value)}/>)}</div>}</div>;
 };
 return <><div className="pagebar">Screening <span className="muted">/ Massive-powered equity filters</span></div><main className="screen-page"><div className="screen-toolbar"><div><h1>Stock Screener</h1><p className="muted small">Combine filters to find securities. Financial ratios require Massive Financials & Ratios access.</p></div><div className="screen-controls"><label>Dataset <select value={mode} onChange={e=>{setMode(e.target.value as "ratios"|"reference");setRows([]);setRequested(false);setFilters({})}}><option value="ratios">Financials & Ratios</option><option value="reference">All listed tickers</option></select></label><label>Symbol <input value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="Any ticker" /></label><button disabled={busy} onClick={()=>load()}>{busy?"Loading…":"Run screen"}</button><button className="screen-reset" onClick={()=>{setFilters({});setTicker("");setRows([]);setRequested(false);setCursor(null)}}>Reset</button></div></div><div className="screen-filters">{fields.map(f=><div key={f.key} className={"screen-filter"+(f.available===false||(mode==="reference"&&f.kind!=="select")?" screen-disabled":"")} title={f.available===false?"Not available from Massive ratios endpoint":undefined}><label>{f.label}</label>{filterCell(f)}</div>)}</div><div className="screen-foot"><span>{active} active filters · {rows.length} loaded securities{cursor?" · More available":""}</span><span>Market cap inputs in USD billions; percentage inputs as %, e.g. 15 for 15%</span></div>{error&&<div className="screen-error">{error}{error.includes("MASSIVE_API_KEY")?<p>Add the key in Vercel → Project Settings → Environment Variables, then redeploy. GitHub secrets are not automatically shared with Vercel.</p>:null}</div>}{notice&&<p className="muted small">{notice}</p>}<div className="screen-results"><table><thead><tr>{(mode==="reference"?[["ticker","Ticker"],["name","Company"],["primary_exchange","Exchange"],["locale","Country"],["type","Type"]]:columns).map(([key,label])=><th key={key}><button onClick={()=>{setDescending(sort===key?!descending:false);setSort(key)}}>{label} {sort===key?(descending?"↓":"↑"):""}</button></th>)}</tr></thead><tbody>{sorted.map((r,i)=><tr key={String(r.ticker)+i}>{(mode==="reference"?["ticker","name","primary_exchange","locale","type"]:columns.map(c=>c[0])).map(key=><td key={key}>{key==="ticker"?<a href={"/company/"+encodeURIComponent(String(r.ticker))}>{String(r.ticker)}</a>:typeof r[key]==="number"?format(r[key],key):String(r[key]??"—")}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="screen-empty">{requested?"No matching results returned.":"Set your filters and run a screen to load data from Massive."}</p>}</div>{cursor&&<button className="screen-more" disabled={busy} onClick={()=>load(cursor)}>{busy?"Loading…":"Load next 500 results"}</button>}<p className="muted small">Data source: <a href="https://massive.com/docs/rest/stocks/overview" target="_blank" rel="noopener noreferrer">Massive API</a>. Metrics without supported endpoints are disabled rather than estimated. Screens run against the available API dataset, not a sample of locally stored stocks.</p></main></>;
}
