"use client";
import {useMemo,useRef,useState} from "react";
type Point={t:number;c:number};
const ranges=["1M","3M","6M","1Y","3Y","5Y","ALL"] as const;
function sma(a:number[],n:number){return a.map((_,i)=>i<n-1?null:a.slice(i-n+1,i+1).reduce((s,v)=>s+v,0)/n)}
function rsi(a:number[],n=14){return a.map((_,i)=>{if(i<n)return null;let gain=0,loss=0;for(let j=i-n+1;j<=i;j++){const d=a[j]-a[j-1];gain+=Math.max(0,d);loss+=Math.max(0,-d)}return loss===0?100:100-100/(1+gain/loss)})}
export default function TechnicalPriceChart({ticker,points,benchmark}:{ticker:string;points:Point[];benchmark:Point[]}){
 const [otherTicker,setOtherTicker]=useState(""),[otherInput,setOtherInput]=useState(""),[otherPoints,setOtherPoints]=useState<Point[]>([]),[otherError,setOtherError]=useState("");
 const svgRef=useRef<SVGSVGElement>(null);const [hover,setHover]=useState<number|null>(null),[compare,setCompare]=useState(false),[range,setRange]=useState<(typeof ranges)[number]>("1Y"),[ma20,setMa20]=useState(true),[ma50,setMa50]=useState(false),[showRsi,setShowRsi]=useState(false);
 const selected=useMemo(()=>{const last=points.at(-1)?.t||0;const days:Record<string,number>={"1M":31,"3M":92,"6M":183,"1Y":366,"3Y":1096,"5Y":1827,"ALL":999999};return points.filter(p=>p.t>=last-days[range]*86400)},[points,range]);
 const otherComparison=useMemo(()=>{const map=new Map(otherPoints.map(p=>[new Date(p.t*1000).toISOString().slice(0,10),p.c]));let last:number|null=null;return selected.map(p=>{last=map.get(new Date(p.t*1000).toISOString().slice(0,10))??last;return last})},[otherPoints,selected]);
 const closes=selected.map(p=>p.c),maA=sma(points.map(p=>p.c),20).slice(points.length-selected.length),maB=sma(points.map(p=>p.c),50).slice(points.length-selected.length),rs=rsi(points.map(p=>p.c)).slice(points.length-selected.length);const comparison=useMemo(()=>{const map=new Map(benchmark.map(p=>[new Date(p.t*1000).toISOString().slice(0,10),p.c]));let last:number|null=null;return selected.map(p=>{last=map.get(new Date(p.t*1000).toISOString().slice(0,10))??last;return last})},[benchmark,selected]);const w=1100,h=360,left=70,right=25,top=24,bottom=42;const all=[...closes,...(ma20?maA:[]),...(ma50?maB:[])].filter((x):x is number=>x!==null);const lo=Math.min(...all),hi=Math.max(...all);const x=(i:number)=>left+i*(w-left-right)/Math.max(1,selected.length-1),y=(v:number)=>h-bottom-(v-lo)/(hi-lo||1)*(h-top-bottom);
 const onMove=(e:React.PointerEvent<SVGSVGElement>)=>{const rect=svgRef.current?.getBoundingClientRect();if(!rect)return;const px=(e.clientX-rect.left)/rect.width*w;setHover(Math.max(0,Math.min(selected.length-1,Math.round((px-left)/(w-left-right)*(selected.length-1)))))};
 const path=(arr:(number|null)[])=>arr.map((v,i)=>v===null?"":(i===0||arr[i-1]===null?"M":"L")+x(i)+","+y(v)).join(" ");

 const renderTooltip=(i:number)=>(
  <div className="tip" style={{left:(x(i)/w*100)+"%",transform:x(i)>w*.6?"translateX(calc(-100% - 12px))":"translateX(12px)"}}>
   <div className="tip-date">{new Date(selected[i].t*1000).toLocaleDateString("en-US",{timeZone:"UTC"})}</div>
   <div className="tip-row">{ticker}: {"$"+closes[i].toFixed(2)}</div>
   {ma20&&maA[i]!==null&&<div className="tip-sub">MA20: {"$"+maA[i]!.toFixed(2)}</div>}
   {ma50&&maB[i]!==null&&<div className="tip-sub">MA50: {"$"+maB[i]!.toFixed(2)}</div>}
   {compare&&comparison[i]!==null&&<div className="tip-sub">S&amp;P 500: {comparison[i]!.toFixed(2)}</div>}
   {otherTicker&&otherComparison[i]!==null&&<div className="tip-sub">{otherTicker}: {"$"+otherComparison[i]!.toFixed(2)}</div>}
  </div>
 );
 const comparePath=(values:(number|null)[])=>values[0]===null||!values[0]||!closes[0]?"":path(values.map(v=>v===null?null:v/values[0]!*closes[0]));
 const submitComparison=async(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  const t=otherInput.trim().toUpperCase();
  if(!t){setOtherTicker("");setOtherPoints([]);return;}
  setOtherError("");
  try{
   const r=await fetch("/api/company-price-history?ticker="+encodeURIComponent(t));
   if(!r.ok)throw Error("Price data unavailable");
   const d=await r.json();
   setOtherPoints(d.points);setOtherTicker(t);
  }catch{setOtherError("Unable to load comparison ticker");}
 };
 return (
  <div className="panel">
   <h2>{ticker} Price Chart</h2>
   <div className="financial-filters">
    <label>Duration <select value={range} onChange={e=>setRange(e.target.value as typeof range)}>{ranges.map(r=><option key={r}>{r}</option>)}</select></label>
    <label>20-day MA <input type="checkbox" checked={ma20} onChange={e=>setMa20(e.target.checked)}/></label>
    <label>50-day MA <input type="checkbox" checked={ma50} onChange={e=>setMa50(e.target.checked)}/></label>
    <label>RSI (14) <input type="checkbox" checked={showRsi} onChange={e=>setShowRsi(e.target.checked)}/></label>
    <label>Compare S&amp;P 500 <input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/></label>
    <form onSubmit={submitComparison}>
     <label>Compare ticker <input value={otherInput} onChange={e=>setOtherInput(e.target.value)} placeholder="MSFT" style={{width:95}}/></label>
     <button type="submit">Compare</button>
    </form>
    {otherError&&<span className="neg small">{otherError}</span>}
   </div>
   {selected.length>1 ? (
    <>
     <div className="chart-wrap">
      <svg ref={svgRef} onPointerMove={onMove} onPointerLeave={()=>setHover(null)} viewBox={`0 0 ${w} ${h}`} style={{width:"100%",background:"#141b25",borderRadius:8}} role="img" aria-label="Historical closing prices with optional moving averages">
       {[0,1,2,3,4].map(i=>{const v=lo+(hi-lo)*i/4;return <g key={i}><line x1={left} x2={w-right} y1={y(v)} y2={y(v)} stroke="#344154"/><text x={left-9} y={y(v)+4} fill="#aabbd0" textAnchor="end" fontSize="13">{"$"+v.toFixed(2)}</text></g>})}
       <path d={path(closes)} fill="none" stroke="#4da3ff" strokeWidth="2"/>
       {compare&&<path d={comparePath(comparison)} fill="none" stroke="#1fd179" strokeWidth="2"/>}
       {otherTicker&&<path d={comparePath(otherComparison)} fill="none" stroke="#d59bff" strokeWidth="2"/>}
       {ma20&&<path d={path(maA)} fill="none" stroke="#f6b44b" strokeWidth="2"/>}
       {ma50&&<path d={path(maB)} fill="none" stroke="#2ad19b" strokeWidth="2"/>}
       {[0,1,2,3,4].map(i=>{const n=Math.round(i*(selected.length-1)/4);const p=selected[n];return <text key={i} x={x(n)} y={h-12} fill="#aabbd0" textAnchor="middle" fontSize="12">{new Date(p.t*1000).toISOString().slice(0,10)}</text>})}
      </svg>
      {hover!==null&&selected[hover]&&renderTooltip(hover)}
     </div>
     {showRsi&&(
      <div className="chart-wrap">
       <svg viewBox="0 0 1100 145" style={{width:"100%",background:"#141b25",borderRadius:8,marginTop:8}} onPointerMove={e=>{const rect=e.currentTarget.getBoundingClientRect();const px=(e.clientX-rect.left)/rect.width*w;setHover(Math.max(0,Math.min(selected.length-1,Math.round((px-left)/(w-left-right)*(selected.length-1)))));}} onPointerLeave={()=>setHover(null)}>
        <text x="12" y="20" fill="#b8c8dd">RSI (14)</text>
        {[30,70].map(v=><g key={v}><line x1="70" x2="1075" y1={130-v} y2={130-v} stroke="#566273" strokeDasharray="4 4"/><text x="1077" y={134-v} fill="#b8c8dd" fontSize="12">{v}</text></g>)}
        {rs.map((v,i)=>{if(v===null||i===0||rs[i-1]===null)return null;const previous=rs[i-1]!;const color=v>70?"#ff5a55":v<30?"#1fd179":"#d59bff";return <line key={i} x1={x(i-1)} y1={130-previous} x2={x(i)} y2={130-v} stroke={color} strokeWidth="2"/>;})}
       </svg>
       {hover!==null&&rs[hover]!==null&&<div className="tip" style={{left:(x(hover)/w*100)+"%",top:8}}>RSI (14): {rs[hover]!.toFixed(2)}</div>}
      </div>
     )}
    </>
   ) : <p className="muted">Historical price data unavailable.</p>}
   <p className="muted small">Daily closing prices. Moving averages and RSI are calculated locally. Intraday ranges require a separate intraday data feed.</p>
  </div>
 );
}
