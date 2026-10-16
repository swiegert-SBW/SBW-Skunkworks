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
const available=new Set(["market_cap","price","change","current_volume","sector","industry","country","exchange","ipo_date"]);
const labels:Record<string,string>={exchange:"Exchange",index:"Index",sector:"Sector",industry:"Industry",country:"Country",ipo_date:"IPO year"};
const lists:Record<string,string[]>={exchange:["NASDAQ","NYSE","AMEX"],index:["S&P 500","NASDAQ 100","Russell 2000"],sector:["Technology","Healthcare","Financial","Consumer Cyclical","Consumer Defensive","Industrials","Energy","Utilities","Basic Materials","Real Estate","Communication Services"],industry:[],country:["USA","China","Canada","United Kingdom","Israel","India","Brazil","Germany","Japan"]};
const extraOptions:Record<string,string[]>={earnings_date:["Today","Tomorrow","This Week","Next Week","This Month"],option_short:["Optionable","Shortable","Optionable and Shortable"],analyst_recommendation:["Strong Buy","Buy","Hold","Sell","Strong Sell"],pattern:["Channel","Wedge","Triangle","Double Top","Double Bottom","Head & Shoulders"],candlestick:["Doji","Hammer","Engulfing","Morning Star","Evening Star"],performance:["Up","Down","Over 5%","Over 10%","Under -5%","Under -10%"],performance_2:["Up","Down","Over 5%","Over 10%","Under -5%","Under -10%"],insider_transactions:["Positive","Negative"],institutional_transactions:["Positive","Negative"],trades:["Elite only","All"],ipo_date:["2026","2025","2024","2023","2022","Before 2020"],highlow52:["New High","New Low","Within 10% of High","Within 10% of Low"],highlow20:["New High","New Low"],highlow50:["New High","New Low"],ath:["New High","New Low"]};
const currency=(v:unknown)=>{if(typeof v!=="number")return "—";return Math.abs(v)>=1e12?(v/1e12).toFixed(2)+"T":Math.abs(v)>=1e9?(v/1e9).toFixed(2)+"B":Math.abs(v)>=1e6?(v/1e6).toFixed(2)+"M":v.toLocaleString()};
const nfmt=(v:unknown)=>typeof v==="number"?v.toLocaleString(undefined,{maximumFractionDigits:2}):"—";
const numericValue=(r:Item,k:string)=>k==="current_volume"?r.volume:r[k];
export default function ScreeningPage(){
 const [all,setAll]=useState<Item[]>([]),[filters,setFilters]=useState<Record<string,string>>({}),[ticker,setTicker]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[loaded,setLoaded]=useState(false),[sort,setSort]=useState("ticker"),[desc,setDesc]=useState(false),[perPage,setPerPage]=useState("25"),[page,setPage]=useState(1);
 useEffect(()=>{let active=true;setBusy(true);fetch("/api/screening").then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error||"Unable to load stocks");if(active){setAll(j.results);setLoaded(true)}}).catch(e=>{if(active)setError(String(e.message||e))}).finally(()=>{if(active)setBusy(false)});return()=>{active=false}},[]);
 const choices=useMemo(()=>{const result:Record<string,string[]>={};for(const key of ["sector","industry","country","exchange"]){result[key]=Array.from(new Set(all.map(r=>String(r[key]||"").trim()).filter(x=>x&&x!=="N/A"))).sort()}return result},[all]);
 const isNumeric=(f:Field)=>!["exchange","index","sector","industry","country","ipo_date","earnings_date","option_short","analyst_recommendation","pattern","candlestick","trades","insider_transactions","institutional_transactions","highlow52","highlow20","highlow50","ath","performance","performance_2"].includes(f.key);
 const options=(f:Field)=>choices[f.key]?.length?choices[f.key]:lists[f.key]||extraOptions[f.key]||[];
 const selectValue=(f:Field)=>filters[f.key]||"";
 const filterUI=(f:Field)=>{
  const val=selectValue(f),num=isNumeric(f),p=num?presets(f):[];
  return <div className="screen-filter-control"><select aria-label={f.label} value={val} onChange={e=>{setFilters(prev=>({...prev,[f.key]:e.target.value}));setPage(1)}}><option value="">Any</option>{num?p.map((o,i)=><option key={i} value={String(i)}>{o.label}</option>):options(f).map(o=><option key={o} value={o}>{o}</option>)}{num&&<option value="custom">Custom range…</option>}</select>{num&&val==="custom"&&<div className="screen-range">{(["gte","lte"] as const).map(op=><input key={op} type="number" step="any" aria-label={f.label+" "+(op==="gte"?"minimum":"maximum")} placeholder={op==="gte"?"Min":"Max"} value={filters[f.key+":"+op]||""} onChange={e=>{setFilters(prev=>({...prev,[f.key+":"+op]:e.target.value}));setPage(1)}}/>)}</div>}</div>;
 };
 const active=fields.filter(f=>selectValue(f)).map(f=>f.label);
 const unsupported=fields.filter(f=>selectValue(f)&&!available.has(f.key)).map(f=>f.label);
 const filtered=useMemo(()=>all.filter(r=>{
  if(ticker.trim()&&!String(r.ticker||"").toUpperCase().includes(ticker.trim().toUpperCase())&&!String(r.name||"").toUpperCase().includes(ticker.trim().toUpperCase()))return false;
  for(const f of fields){const v=filters[f.key];if(!v||!available.has(f.key))continue;
   if(!isNumeric(f)){if(f.key==="ipo_date"){if(v==="Before 2020"){if(Number(r.ipo_date)>=2020) return false}else if(String(r.ipo_date)!==v)return false}else if(String(r[f.key]||"").toLowerCase()!==v.toLowerCase())return false;continue}
   const n=numericValue(r,f.key);if(typeof n!=="number"||!Number.isFinite(n))return false;
   const p=v==="custom"?null:presets(f)[Number(v)];
   const lo=v==="custom"?filters[f.key+":gte"]:p?.min,hi=v==="custom"?filters[f.key+":lte"]:p?.max;
   const mult=f.unit==="money"?1e9:1;
   if(lo!==undefined&&lo!==""&&n<Number(lo)*mult)return false;
   if(hi!==undefined&&hi!==""&&n>Number(hi)*mult)return false;
  }
  return true;
 }),[all,filters,ticker]);
 const sorted=useMemo(()=>[...filtered].sort((a,b)=>{const av=a[sort],bv=b[sort];const result=typeof av==="number"&&typeof bv==="number"?av-bv:String(av??"").localeCompare(String(bv??""));return desc?-result:result}),[filtered,sort,desc]);
 const size=perPage==="all"?sorted.length:Number(perPage),pages=Math.max(1,Math.ceil(sorted.length/(size||1))),shown=perPage==="all"?sorted:sorted.slice((Math.min(page,pages)-1)*size,Math.min(page,pages)*size);
 const headers:[string,string][]=[["ticker","Ticker"],["name","Company"],["sector","Sector"],["industry","Industry"],["country","Country"],["market_cap","Market Cap"],["price","Price"],["change_percent","Change %"],["volume","Volume"]];
 return <><div className="pagebar">Screening <span className="muted">/ Nasdaq market data</span></div><main className="screen-page"><div className="screen-toolbar"><div><h1>Stock Screener</h1><p className="muted small">Free Nasdaq-listed U.S. stock universe. Select Finviz-style filters and custom numeric ranges.</p></div><div className="screen-controls"><label>Search <input value={ticker} placeholder="Ticker or company" onChange={e=>{setTicker(e.target.value);setPage(1)}}/></label><button className="screen-reset" onClick={()=>{setFilters({});setTicker("");setPage(1)}}>Clear filters</button></div></div><div className="screen-filters">{fields.map(f=><div key={f.key} className={"screen-filter"+(!available.has(f.key)?" screen-limited":"")} title={!available.has(f.key)?"Preset available; this metric is not provided by the free data feed and will not affect results":undefined}><label>{f.label}{!available.has(f.key)&&<sup title="Not supported by free source">†</sup>}</label>{filterUI(f)}</div>)}</div><div className="screen-foot"><span>{active.length} selected filters · {filtered.length.toLocaleString()} matches / {all.length.toLocaleString()} loaded</span><span>Market cap custom values in $B · † = filter not supported by current free data source</span></div>{unsupported.length>0&&<div className="screen-error">These selected filters are not applied because Nasdaq does not provide the required data: {unsupported.join(", ")}. Other supported filters remain active.</div>}{error&&<div className="screen-error">{error}</div>}<div className="screen-result-toolbar"><strong>{busy?"Loading stocks…":loaded?filtered.length.toLocaleString()+" results":"Stock results"}</strong><div className="screen-result-actions"><label>Show <select value={perPage} onChange={e=>{setPerPage(e.target.value);setPage(1)}}><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="all">All</option></select></label><span>Page {Math.min(page,pages)} / {pages}</span><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>←</button><button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>→</button></div></div><div className="screen-results"><table><thead><tr><th>No.</th>{headers.map(([key,label])=><th key={key}><button onClick={()=>{setDesc(sort===key?!desc:false);setSort(key);setPage(1)}}>{label} {sort===key?(desc?"↓":"↑"):""}</button></th>)}</tr></thead><tbody>{shown.map((r,i)=><tr key={String(r.ticker)+i}><td>{(Math.min(page,pages)-1)*size+i+1}</td><td><a href={"/company/"+encodeURIComponent(String(r.ticker))}>{String(r.ticker)}</a></td><td>{String(r.name||"—")}</td><td>{String(r.sector||"—")}</td><td>{String(r.industry||"—")}</td><td>{String(r.country||"—")}</td><td>{currency(r.market_cap)}</td><td>{typeof r.price==="number"?"$"+nfmt(r.price):"—"}</td><td className={typeof r.change_percent==="number"?(r.change_percent>=0?"pos":"neg"):""}>{typeof r.change_percent==="number"?(r.change_percent>0?"+":"")+nfmt(r.change_percent)+"%":"—"}</td><td>{nfmt(r.volume)}</td></tr>)}</tbody></table>{!shown.length&&!busy&&<p className="screen-empty">{error?"Could not load stock data.":"No stocks match the applied filters."}</p>}</div><p className="muted small">Source: Nasdaq public stock screener. Quotes may be delayed. Unsupported metrics are selectable for planning but explicitly excluded from screening. “All” displays every matching stock loaded from the source, not an artificially limited page.</p></main></>;
}
