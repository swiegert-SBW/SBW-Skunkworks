"use client";
import {useEffect,useMemo,useState} from "react";
type Tile={ticker:string;name:string;sector:string;industry:string;marketCap:number;marketCapEstimated?:boolean;change:number;price:number|null;quoteAvailable:boolean};
type Watchlist={id:string;name:string;tickers:string[]};
type Rect={x:number;y:number;w:number;h:number};
const KEY="sbw-workstation-watchlists-v1";
const indexes=[["sp500","S&P 500"],["nasdaq100","Nasdaq 100"],["dow30","Dow 30"],["russell2000","Russell 2000"]];
function cap(v:number){return v>=1e12?"$"+(v/1e12).toFixed(2)+"T":v>=1e9?"$"+(v/1e9).toFixed(1)+"B":"$"+(v/1e6).toFixed(0)+"M"}
function color(v:number){return v<=-3?"#a9343d":v<=-1.5?"#ba4148":v<-.4?"#70434c":v<.4?"#354b49":v<1.5?"#27764b":v<3?"#1c9851":"#24b75d"}
const SECTORS=["Communication Services","Consumer Discretionary","Consumer Staples","Energy","Financials","Health Care","Industrials","Information Technology","Materials","Real Estate","Utilities","Other"];
function partition(items:Tile[],rect:Rect):Array<{tile:Tile;rect:Rect}>{const sorted=[...items].sort((a,b)=>Math.max(1,b.marketCap)-Math.max(1,a.marketCap));const total=sorted.reduce((s,t)=>s+Math.max(1,t.marketCap),0)||1;let offset=0;return sorted.map((tile,i)=>{const share=Math.max(1,tile.marketCap)/total;let r:Rect;if(rect.w>=rect.h){const w=i===sorted.length-1?rect.w-offset:rect.w*share;r={x:rect.x+offset,y:rect.y,w,h:rect.h};offset+=w}else{const h=i===sorted.length-1?rect.h-offset:rect.h*share;r={x:rect.x,y:rect.y+offset,w:rect.w,h};offset+=h}return {tile,rect:r}})}
function layout(items:Tile[],rect:Rect):Array<{tile:Tile;rect:Rect}>{
 if(!items.length)return [];
 const sorted=[...items].filter(t=>Number.isFinite(t.marketCap)&&t.marketCap>0).sort((a,b)=>b.marketCap-a.marketCap);
 if(!sorted.length)return items.map(tile=>({tile,rect}));
 const total=sorted.reduce((s,t)=>s+t.marketCap,0),scale=rect.w*rect.h/total;
 const nodes=sorted.map(tile=>({tile,area:tile.marketCap*scale}));
 const result:Array<{tile:Tile;rect:Rect}>=[];
 const worst=(row:Array<{tile:Tile;area:number}>,side:number)=>{if(!row.length)return Infinity;const sum=row.reduce((s,n)=>s+n.area,0),lo=Math.min(...row.map(n=>n.area)),hi=Math.max(...row.map(n=>n.area));return Math.max(side*side*hi/(sum*sum),(sum*sum)/(side*side*lo))};
 const placeRow = (row: Array<{ tile: Tile; area: number }>, box: Rect): Rect => {
  const sum = row.reduce((acc, node) => acc + node.area, 0);
  if (box.w >= box.h) {
   const stripH = sum / box.w;
   let x = box.x;
   row.forEach((node, i) => {
    const w = i === row.length - 1 ? box.x + box.w - x : node.area / stripH;
    result.push({ tile: node.tile, rect: { x, y: box.y, w, h: stripH } });
    x += w;
   });
   return { x: box.x, y: box.y + stripH, w: box.w, h: Math.max(0, box.h - stripH) };
  }
  const stripW = sum / box.h;
  let y = box.y;
  row.forEach((node, i) => {
   const h = i === row.length - 1 ? box.y + box.h - y : node.area / stripW;
   result.push({ tile: node.tile, rect: { x: box.x, y, w: stripW, h } });
   y += h;
  });
  return { x: box.x + stripW, y: box.y, w: Math.max(0, box.w - stripW), h: box.h };
 };
 let remaining={...rect};let row:Array<{tile:Tile;area:number}>=[];
 while(nodes.length){const next=nodes[0],side=Math.min(remaining.w,remaining.h);if(!row.length||worst([...row,next],side)<=worst(row,side)){row.push(nodes.shift()!)}else{remaining=placeRow(row,remaining);row=[]}}
 if(row.length)placeRow(row,remaining);
 return result
}
export default function MarketsPage(){const[index,setIndex]=useState("sp500"),[period,setPeriod]=useState("1d"),[lists,setLists]=useState<Watchlist[]>([]),[watchId,setWatchId]=useState(""),[tiles,setTiles]=useState<Tile[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[updated,setUpdated]=useState("");
useEffect(()=>{const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");const safe=Array.isArray(v)?v:[];setLists(safe);setWatchId(id=>safe.some(l=>l.id===id)?id:(safe[0]?.id||""))}catch{setLists([]);setWatchId("")}};read();window.addEventListener("storage",read);window.addEventListener("sbw-watchlists-updated",read);return()=>{window.removeEventListener("storage",read);window.removeEventListener("sbw-watchlists-updated",read)}},[]);
const current=lists.find(l=>l.id===watchId);
useEffect(()=>{if(index==="watchlist"&&current){localStorage.setItem("sbw-selected-watchlist-id",current.id);window.dispatchEvent(new Event("sbw-watchlists-updated"))}},[index,watchId,current?.id]);
useEffect(()=>{
 if(index==="watchlist"&&(!current||!current.tickers.length)){setTiles([]);setLoading(false);setError(current?"This watchlist is empty. Add tickers in the Watchlist tab.":"Create a watchlist first in the Watchlist tab.");return;}
 let live=true;
 const controller=new AbortController();
 setLoading(true);setError("");setTiles([]);
 const qs=new URLSearchParams({index,period});
 if(index==="watchlist"&&current)qs.set("tickers",current.tickers.join(","));
 const load=async(offset:number)=>{const q=new URLSearchParams(qs);q.set("offset",String(offset));q.set("limit","25");const res=await fetch("/api/heatmap?"+q.toString(),{signal:controller.signal});const data=await res.json();if(!res.ok)throw Error(data.error||"Market data is temporarily unavailable.");return data;};
 (async()=>{
  try{
   const first=await load(0);
   const total=Number(first.total)||0;
   const all=[...first.tiles];
   const offsets=Array.from({length:Math.max(0,Math.ceil(total/25)-1)},(_,i)=>(i+1)*25);
   let next=0,missing=Number(first.missingQuotes)||0;
   await Promise.all(Array.from({length:Math.min(4,offsets.length)},async()=>{while(next<offsets.length){const offset=offsets[next++];const page=await load(offset);all.push(...page.tiles);missing+=Number(page.missingQuotes)||0;if(live)setTiles([...new Map(all.map(t=>[t.ticker,t])).values()]);}}));
   if(live){setTiles([...new Map(all.map(t=>[t.ticker,t])).values()]);setUpdated(first.updatedAt||"");setError(missing?missing+" constituents have unavailable quotes and are shown with neutral performance.":"");}
  }catch(e){if(live){setError(e instanceof Error?e.message:"Heatmap unavailable.");setTiles([]);}}
  finally{if(live)setLoading(false);}
 })();
 return()=>{live=false;controller.abort();};
},[index,period,watchId,lists]);
const unique=useMemo(()=>[...new Map(tiles.map(t=>[t.ticker,t])).values()],[tiles]);
const grouped=useMemo(()=>SECTORS.map(sector=>({sector,items:unique.filter(t=>(t.sector||"Other")===sector)})).filter(g=>g.items.length),[unique]);
const total=unique.reduce((sum,t)=>sum+Math.max(0,t.marketCap),0);
const blocks=useMemo(()=>layout(grouped.map(g=>({ticker:g.sector,name:g.sector,sector:g.sector,industry:"",marketCap:g.items.reduce((v,t)=>v+Math.max(1,t.marketCap),0),change:0,price:null,quoteAvailable:false})),{x:0,y:0,w:100,h:100}),[grouped]);
return <><div className="pagebar">Markets <span className="muted">/ Stock Heatmap</span></div><main className="market-map-page"><section className="heatmap-toolbar"><div><h1>Stock Heatmap</h1><p className="muted">Tile area is proportional to market capitalization. Hover over any tile for company details.</p></div><div className="heatmap-filters"><label>Index / Watchlist<select value={index} onChange={e=>setIndex(e.target.value)}>{indexes.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}<option value="watchlist">My watchlists</option></select></label>{index==="watchlist"&&<label>Watchlist<select value={watchId} onChange={e=>setWatchId(e.target.value)}>{lists.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}<label>Performance<select value={period} onChange={e=>setPeriod(e.target.value)}><option value="1d">Today</option><option value="5d">5 Days</option><option value="1mo">1 Month</option><option value="3mo">3 Months</option><option value="1y">1 Year</option></select></label></div></section><div className="heatmap-legend"><span>Decliners</span>{["#a9343d","#ba4148","#70434c","#354b49","#27764b","#1c9851","#24b75d"].map(c=><i key={c} style={{background:c}}/>)}<span>Gainers</span><span className="heatmap-cap">{unique.length} constituents · {unique.filter(t=>t.marketCapEstimated).length} estimated tile sizes · Displayed size basis: {cap(total)}</span></div>{loading?<div className="heatmap-state">Loading market data…</div>:tiles.length===0?<div className="heatmap-state">{error||"No market data returned."}</div>:<div className="heatmap-sector-grid">{blocks.map(({tile:sectorTile,rect:sectorRect})=>{const g=grouped.find(x=>x.sector===sectorTile.ticker)!;const industries=[...new Set(g.items.map(t=>t.industry||"Other industry"))];const industryGroups=industries.map(industry=>({industry,items:g.items.filter(t=>(t.industry||"Other industry")===industry)}));const industryRects=layout(industryGroups.map(v=>({ticker:v.industry,name:v.industry,sector:g.sector,industry:v.industry,marketCap:v.items.reduce((n,t)=>n+Math.max(1,t.marketCap),0),change:0,price:null,quoteAvailable:false})),{x:0,y:0,w:100,h:100});return <section className="heatmap-sector" key={g.sector} style={{left:sectorRect.x+"%",top:sectorRect.y+"%",width:sectorRect.w+"%",height:sectorRect.h+"%"}}><h2>{g.sector}</h2><div className="heatmap-sector-tiles">{industryRects.map(({tile:industryTile,rect:ir})=>{const industry=industryGroups.find(x=>x.industry===industryTile.ticker)!;return <div className="heatmap-industry" key={industry.industry} style={{left:ir.x+"%",top:ir.y+"%",width:ir.w+"%",height:ir.h+"%"}}><h3>{industry.industry}</h3><div className="heatmap-industry-tiles">{layout(industry.items,{x:0,y:0,w:100,h:100}).map(({tile:t,rect})=>{const area=rect.w*rect.h*ir.w*ir.h*sectorRect.w*sectorRect.h/1e8;return <a key={t.ticker} className="heatmap-tile" href={"/company/"+encodeURIComponent(t.ticker)} title={t.name+" ("+t.ticker+") · "+(t.quoteAvailable?t.change.toFixed(2)+"%":"Quote unavailable")+" · "+(t.marketCapEstimated?"Estimated tile size (market cap unavailable)":"Market cap "+cap(t.marketCap))} style={{left:rect.x+"%",top:rect.y+"%",width:rect.w+"%",height:rect.h+"%",background:t.quoteAvailable?color(t.change):"#454b54"}}>{area>0.015&&<strong>{t.ticker}</strong>}{area>0.045&&<span>{t.quoteAvailable?(t.change>=0?"+":"")+t.change.toFixed(2)+"%":"N/A"}</span>}</a>})}</div></div>})}</div></section>})}</div>}{error&&tiles.length>0&&<p className="muted heatmap-note">{error}</p>}<footer className="heatmap-footer">Yahoo Finance quote data · Tile area reflects relative market capitalization; quote metadata may be delayed{updated?" · Updated "+new Date(updated).toLocaleString():""}</footer></main></>}