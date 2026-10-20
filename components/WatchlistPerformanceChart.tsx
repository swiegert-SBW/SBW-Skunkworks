"use client";
import {useEffect,useMemo,useState} from "react";
type Point={t:number;c:number};
type Line={ticker:string;points:Point[]};
const ranges=[["1M","1mo"],["3M","3mo"],["6M","6mo"],["1Y","1y"],["3Y","3y"],["5Y","5y"]] as const;
const colors=["#37ce7c","#4b9fff","#ffc14d","#f17d87","#b590ef","#34d1cf","#ff8c44","#c5e867","#f378d1","#8cc0ff"];
export default function WatchlistPerformanceChart({tickers}:{tickers:string[]}){
 const [range,setRange]=useState("3mo"),[lines,setLines]=useState<Line[]>([]),[excluded,setExcluded]=useState<string[]>([]),[entry,setEntry]=useState(""),[loading,setLoading]=useState(false),[hover,setHover]=useState<number|null>(null);
 const key=tickers.join(",");
 useEffect(()=>{setExcluded([])},[key]);
 useEffect(()=>{
  if(!tickers.length){setLines([]);return}
  const controller=new AbortController();setLoading(true);
  fetch("/api/watchlist-history?"+new URLSearchParams({tickers:key,range}),{signal:controller.signal}).then(r=>r.json()).then(j=>{if(!controller.signal.aborted)setLines(Array.isArray(j.series)?j.series:[])}).catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[key,range]);
 const visible=useMemo(()=>lines.filter(l=>!excluded.includes(l.ticker)&&l.points.length>1).map(l=>{const first=l.points[0].c;return {...l,values:l.points.map(p=>({t:p.t,v:(p.c/first-1)*100}))}}),[lines,excluded]);
 const all=visible.flatMap(l=>l.values),t0=Math.min(...all.map(p=>p.t)),t1=Math.max(...all.map(p=>p.t)),min=Math.min(0,...all.map(p=>p.v)),max=Math.max(0,...all.map(p=>p.v));
 const W=1100,H=390,left=54,right=95,top=20,bottom=45;
 const x=(t:number)=>left+(t-t0)/(t1-t0||1)*(W-left-right);
 const y=(v:number)=>top+(max-v)/(max-min||1)*(H-top-bottom);
 const fmt=(t:number)=>new Date(t*1000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit",timeZone:"UTC"});
 const add=()=>{const t=entry.trim().toUpperCase();if(tickers.includes(t)&&!excluded.includes(t))setExcluded(e=>[...e,t]);setEntry("")};
 return <section className="panel" style={{marginBottom:18}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><h2 style={{margin:0}}>Watchlist % Change</h2><div className="ranges">{ranges.map(([label,r])=><button key={r} className={range===r?"on":""} onClick={()=>setRange(r)}>{label}</button>)}</div></div>
 <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",margin:"12px 0"}}><input aria-label="Exclude watchlist ticker" placeholder="Exclude ticker..." value={entry} onChange={e=>setEntry(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}}/><button onClick={add}>Exclude</button>{excluded.map(t=><button key={t} onClick={()=>setExcluded(e=>e.filter(x=>x!==t))}>{t} ×</button>)}{loading&&<span className="muted small">Updating chart…</span>}</div>
 {!visible.length?<p className="muted">No price histories available for this watchlist and range.</p>:<><div style={{overflowX:"auto"}}><svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",minWidth:640,background:"#141b25",borderRadius:8}} onPointerMove={e=>{const box=e.currentTarget.getBoundingClientRect();setHover(t0+Math.max(0,Math.min(1,((e.clientX-box.left)/box.width*W-left)/(W-left-right)))*(t1-t0))}} onPointerLeave={()=>setHover(null)}>
 {[0,1,2,3,4].map(i=>{const v=min+(max-min)*i/4;return <g key={i}><line x1={left} x2={W-right} y1={y(v)} y2={y(v)} stroke="#344153"/><text x={W-right+8} y={y(v)+4} fill="#a8b9cf" fontSize="12">{v.toFixed(1)}%</text></g>})}
 {[0,1,2,3,4,5].map(i=>{const t=t0+(t1-t0)*i/5;return <text key={i} x={x(t)} y={H-12} textAnchor="middle" fill="#a8b9cf" fontSize="12">{fmt(t)}</text>})}
 {visible.map((l,i)=><path key={l.ticker} d={l.values.map((p,j)=>(j?"L":"M")+x(p.t).toFixed(1)+","+y(p.v).toFixed(1)).join(" ")} fill="none" stroke={colors[i%colors.length]} strokeWidth="1.8" opacity=".9"/>)}
 {hover!==null&&<line x1={x(hover)} x2={x(hover)} y1={top} y2={H-bottom} stroke="#b0bdcd" strokeDasharray="3 4"/>}
 </svg></div><div style={{display:"flex",gap:"8px 16px",flexWrap:"wrap",marginTop:10}}>{visible.map((l,i)=>{const value=l.values[l.values.length-1].v;return <span key={l.ticker} style={{fontSize:12,color:colors[i%colors.length]}}>{l.ticker} {value>=0?"+":""}{value.toFixed(2)}%</span>})}</div>{hover!==null&&<div className="muted small" style={{marginTop:8}}>{fmt(hover)} · {visible.map(l=>{const p=l.values.reduce((a,b)=>Math.abs(b.t-hover)<Math.abs(a.t-hover)?b:a);return l.ticker+" "+(p.v>=0?"+":"")+p.v.toFixed(1)+"%"}).join(" · ")}</div>}</>}
 </section>
}
