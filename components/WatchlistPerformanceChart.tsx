"use client";
import {useEffect,useMemo,useState} from "react";
type Point={t:number;c:number};
type Line={ticker:string;points:Point[]};
const ranges=[["1M","1mo"],["3M","3mo"],["6M","6mo"],["1Y","1y"],["3Y","3y"],["5Y","5y"]] as const;
const colors=["#37ce7c","#4b9fff","#ffc14d","#f17d87","#b590ef","#34d1cf","#ff8c44","#c5e867","#f378d1","#8cc0ff"];
export default function WatchlistPerformanceChart({tickers,tableOnly=false}:{tickers:string[];tableOnly?:boolean}){
 const [pointer,setPointer]=useState<{x:number;y:number}|null>(null);const [activeTicker,setActiveTicker]=useState<string|null>(null);const [range,setRange]=useState("3mo"),[lines,setLines]=useState<Line[]>([]),[excluded,setExcluded]=useState<string[]>([]),[entry,setEntry]=useState(""),[loading,setLoading]=useState(false),[hover,setHover]=useState<number|null>(null);
 const key=tickers.join(",");
 const [cached,setCached]=useState<Record<string,Line[]>>({});
 useEffect(()=>{setExcluded([])},[key]);
 useEffect(()=>{
  if(!tickers.length){setLines([]);return}
  const controller=new AbortController();const cacheKey=key+"|"+range;const stored=cached[cacheKey];if(stored){setLines(stored);setLoading(false);return()=>controller.abort()}setLoading(true);
  fetch("/api/watchlist-history?"+new URLSearchParams({tickers:key,range}),{signal:controller.signal}).then(r=>r.json()).then(j=>{if(!controller.signal.aborted){const next=Array.isArray(j.series)?j.series:[];setLines(next);setCached(old=>({...old,[cacheKey]:next}))}}).catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[key,range]);
 const visible=useMemo(()=>lines.filter(l=>!excluded.includes(l.ticker)&&l.points.length>1).map(l=>{const first=l.points[0].c;return {...l,values:l.points.map(p=>({t:p.t,v:(p.c/first-1)*100}))}}),[lines,excluded]);
 const all=visible.flatMap(l=>l.values),t0=Math.min(...all.map(p=>p.t)),t1=Math.max(...all.map(p=>p.t)),min=Math.min(0,...all.map(p=>p.v)),max=Math.max(0,...all.map(p=>p.v));
 const W=900,H=360,left=48,right=70,top=20,bottom=42;
 const x=(t:number)=>left+(t-t0)/(t1-t0||1)*(W-left-right);
 const y=(v:number)=>top+(max-v)/(max-min||1)*(H-top-bottom);
 const fmt=(t:number)=>new Date(t*1000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit",timeZone:"UTC"});
 const axisFmt=(t:number)=>{const d=new Date(t*1000);return range==="3y"||range==="5y"?String(d.getUTCFullYear()):d.toLocaleDateString("en-US",{month:"short",year:"numeric",timeZone:"UTC"})};
 const hovered=activeTicker&&hover!==null?(()=>{const l=visible.find(v=>v.ticker===activeTicker);if(!l)return null;const p=l.values.reduce((a,b)=>Math.abs(b.t-hover)<Math.abs(a.t-hover)?b:a);return {ticker:l.ticker,...p}})():null;
 const add=()=>{const t=entry.trim().toUpperCase();if(tickers.includes(t)&&!excluded.includes(t))setExcluded(e=>[...e,t]);setEntry("")};
 if(tableOnly)return <section className="panel watch-side-performance"><h3>Watchlist Performance</h3><div className="watch-performance-rank" style={{display:"block",maxHeight:440}}><table><thead><tr><th>Ticker</th><th>% Change</th></tr></thead><tbody>{[...visible].sort((a,b)=>b.values[b.values.length-1].v-a.values[a.values.length-1].v).map(l=>{const v=l.values[l.values.length-1].v;return <tr key={l.ticker}><td>{l.ticker}</td><td style={{color:v>=0?"#36d788":"#ff7474"}}>{v>=0?"+":""}{v.toFixed(2)}%</td></tr>})}</tbody></table></div></section>;
 return <section className="panel watch-performance-panel" style={{marginBottom:0,minWidth:0}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><h2 style={{margin:0}}>Watchlist % Change</h2><div className="ranges">{ranges.map(([label,r])=><button key={r} className={range===r?"on":""} onClick={()=>setRange(r)}>{label}</button>)}</div></div>
 <div className="watch-performance-controls"><input aria-label="Exclude watchlist ticker" placeholder="Exclude ticker..." value={entry} onChange={e=>setEntry(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}}/><button onClick={add}>Exclude</button>{excluded.map(t=><button key={t} onClick={()=>setExcluded(e=>e.filter(x=>x!==t))}>{t} ×</button>)}{loading&&<span className="muted small">Updating chart…</span>}</div>
 {!visible.length?<p className="muted">No price histories available for this watchlist and range.</p>:<><div className="watch-performance-body"><div style={{overflowX:"auto",minWidth:0,position:"relative"}}><svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",minWidth:400,background:"#141b25",borderRadius:8}} onPointerMove={e=>{const box=e.currentTarget.getBoundingClientRect();setPointer({x:e.clientX-box.left,y:e.clientY-box.top});setHover(t0+Math.max(0,Math.min(1,((e.clientX-box.left)/box.width*W-left)/(W-left-right)))*(t1-t0))}} onPointerLeave={()=>{setHover(null);setPointer(null);setActiveTicker(null)}}>
 {[0,1,2,3,4].map(i=>{const v=min+(max-min)*i/4;return <g key={i}><line x1={left} x2={W-right} y1={y(v)} y2={y(v)} stroke="#344153"/><text x={W-right+8} y={y(v)+4} fill="#a8b9cf" fontSize="12">{v.toFixed(1)}%</text></g>})}
 {[0,1,2,3,4,5].map(i=>{const t=t0+(t1-t0)*i/5;return <text key={i} x={x(t)} y={H-12} textAnchor="middle" fill="#a8b9cf" fontSize="12">{axisFmt(t)}</text>})}
 {visible.map((l,i)=><path key={l.ticker} d={l.values.map((p,j)=>(j?"L":"M")+x(p.t).toFixed(1)+","+y(p.v).toFixed(1)).join(" ")} fill="none" stroke={colors[i%colors.length]} strokeWidth={activeTicker===l.ticker?1.5:.9} opacity={activeTicker&&activeTicker!==l.ticker?.28:.85} onPointerEnter={()=>setActiveTicker(l.ticker)} onPointerLeave={()=>setActiveTicker(null)}/>)}
 {hovered&&<circle cx={x(hovered.t)} cy={y(hovered.v)} r="5" fill="#fff" stroke="#36cfff" strokeWidth="2" pointerEvents="none"/>}{hover!==null&&<line x1={x(hover)} x2={x(hover)} y1={top} y2={H-bottom} stroke="#b0bdcd" strokeDasharray="3 4"/>}
 </svg>{hovered&&pointer&&<div className="watch-hover-tip" style={{left:Math.min(pointer.x+16,640),top:Math.max(8,pointer.y-56)}}><strong>{hovered.ticker}</strong> · {fmt(hovered.t)}<div style={{color:hovered.v>=0?"#3be59b":"#ff7979"}}>{hovered.v>=0?"+":""}{hovered.v.toFixed(2)}%</div></div>}</div><div className="watch-performance-rank"><table><thead><tr><th>Ticker</th><th>% Change</th></tr></thead><tbody>{[...visible].sort((a,b)=>b.values[b.values.length-1].v-a.values[a.values.length-1].v).map(l=>{const v=l.values[l.values.length-1].v;return <tr key={l.ticker} onMouseEnter={()=>setActiveTicker(l.ticker)} onMouseLeave={()=>setActiveTicker(null)} style={{background:activeTicker===l.ticker?"#203247":undefined}}><td>{l.ticker}</td><td style={{color:v>=0?"#36d788":"#ff7474"}}>{v>=0?"+":""}{v.toFixed(2)}%</td></tr>})}</tbody></table></div></div></>}
 </section>
}
