"use client";
import {useEffect,useMemo,useRef,useState} from "react";
type Point={t:number;c:number};
const ranges=["1D","5D","1M","3M","6M","YTD","1Y","3Y","5Y","ALL"] as const;
type Range=(typeof ranges)[number];
function sma(values:number[],n:number){let sum=0;return values.map((v,i)=>{sum+=v;if(i>=n)sum-=values[i-n];return i>=n-1?sum/n:null})}
function rsi(values:number[],n=14){const out:(number|null)[]=Array(values.length).fill(null);if(values.length<=n)return out;let gains=0,losses=0;for(let i=1;i<=n;i++){const d=values[i]-values[i-1];gains+=Math.max(d,0);losses+=Math.max(-d,0)}let ag=gains/n,al=losses/n;out[n]=al===0?(ag===0?50:100):100-100/(1+ag/al);for(let i=n+1;i<values.length;i++){const d=values[i]-values[i-1];ag=(ag*(n-1)+Math.max(d,0))/n;al=(al*(n-1)+Math.max(-d,0))/n;out[i]=al===0?(ag===0?50:100):100-100/(1+ag/al)}return out}
const fmt=(v:number)=>v.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
const dateKey=(t:number)=>new Date(t*1000).toISOString().slice(0,10);
export default function TechnicalPriceChart({ticker}:{ticker:string}){
 const [range,setRange]=useState<Range>("3M"),[points,setPoints]=useState<Point[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [ma20,setMa20]=useState(false),[ma50,setMa50]=useState(false),[showRsi,setShowRsi]=useState(true);
 const [otherInput,setOtherInput]=useState(""),[compared,setCompared]=useState<string[]>([]),[comparisons,setComparisons]=useState<Record<string,Point[]>>({});
 const [hover,setHover]=useState<number|null>(null),svg=useRef<SVGSVGElement>(null);
 useEffect(()=>{const ctl=new AbortController();setLoading(true);setError("");setHover(null);
 fetch("/api/company-price-history?ticker="+encodeURIComponent(ticker)+"&range="+range,{signal:ctl.signal}).then(async r=>{if(!r.ok)throw Error("Historical prices unavailable");return r.json()}).then(d=>setPoints(d.points||[])).catch(e=>{if(e.name!=="AbortError"){setError("Price data is temporarily unavailable");setPoints([])}}).finally(()=>{if(!ctl.signal.aborted)setLoading(false)});
 return ()=>ctl.abort()},[ticker,range]);
 useEffect(()=>{const ctl=new AbortController();if(!compared.length)return;
 Promise.all(compared.map(async t=>{try{const r=await fetch("/api/company-price-history?ticker="+encodeURIComponent(t)+"&range="+range,{signal:ctl.signal});const d=await r.json();return [t,d.points||[]] as const}catch{return [t,[]] as const}})).then(entries=>{if(!ctl.signal.aborted)setComparisons(Object.fromEntries(entries))});return ()=>ctl.abort()},[compared,range]);
 const closes=useMemo(()=>points.map(p=>p.c),[points]),s20=useMemo(()=>sma(closes,20),[closes]),s50=useMemo(()=>sma(closes,50),[closes]),rs=useMemo(()=>rsi(closes),[closes]);
 const w=1200,h=300,left=18,right=95,top=18,bottom=30,chartBottom=h-bottom;
 const colors=["#54a6ff","#f5b544","#c494ff"];
 const aligned=useMemo(()=>compared.map((t,j)=>{const source=comparisons[t]||[];const exact=new Map(source.map(p=>[p.t,p.c]));const daily=new Map(source.map(p=>[dateKey(p.t),p.c]));const values=points.map(p=>exact.get(p.t)??daily.get(dateKey(p.t))??null);const firstIndex=values.findIndex(v=>v!==null);const first=firstIndex>=0?values[firstIndex]:null;const base=points[firstIndex]?.c;return {ticker:t,color:colors[j%colors.length],values:values.map((v,i)=>v===null||first===null||!first||!base||i<firstIndex?null:(v/first-1)*100),start:firstIndex}}),[compared,comparisons,points,closes]);
 const comparing=compared.length>0,baseClose=closes[0]||1;
 const referenceValues=comparing?closes.map(v=>(v/baseClose-1)*100):closes;
 const plottedS20=comparing?s20.map(v=>v===null?null:(v/baseClose-1)*100):s20;
 const plottedS50=comparing?s50.map(v=>v===null?null:(v/baseClose-1)*100):s50;
 const axisFormat=(v:number)=>comparing?(v>=0?"+":"")+v.toFixed(1)+"%":fmt(v);
 const lineEnds=[{ticker,color:"#42c96d",values:referenceValues},...aligned].map(line=>({...line,last:line.values.findLastIndex(v=>v!==null)})).filter(line=>line.last>=0);
 const allValues=[...referenceValues,...(ma20?plottedS20:[]),...(ma50?plottedS50:[]),...aligned.flatMap(a=>a.values)].filter((v):v is number=>v!==null&&Number.isFinite(v));
 const low=allValues.length?Math.min(...allValues):0,high=allValues.length?Math.max(...allValues):1,span=Math.max(.01,high-low),min=low-span*.08,max=high+span*.08;
 const x=(i:number)=>left+i*(w-left-right)/Math.max(1,points.length-1),y=(v:number)=>top+(max-v)/(max-min)*(chartBottom-top);
 const path=(arr:(number|null)[])=>arr.map((v,i)=>v===null?"":(i===0||arr[i-1]===null?"M":"L")+x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ");
 const onMove=(e:React.PointerEvent<SVGSVGElement>)=>{const box=svg.current?.getBoundingClientRect();if(!box||!points.length)return;const p=(e.clientX-box.left)/box.width*w;setHover(Math.max(0,Math.min(points.length-1,Math.round((p-left)/(w-left-right)*(points.length-1)))))};
 const addCompare=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const t=otherInput.trim().toUpperCase();if(/^[A-Z0-9.^-]{1,12}$/.test(t)&&t!==ticker&&!compared.includes(t))setCompared(prev=>[...prev.slice(-2),t]);setOtherInput("")};
 return <div className="panel technical-panel">
  <div className="technical-head"><div><h2>{ticker} Price Chart</h2>{closes.length>0&&<span className="technical-last">{fmt(closes[closes.length-1])}</span>}</div><div className="technical-ranges">{ranges.map(r=><button key={r} type="button" className={r===range?"selected":""} onClick={()=>setRange(r)}>{r==="ALL"?"Max":r}</button>)}</div></div>
  <div className="technical-tools">
   <span className="technical-tool-label">Indicators</span><label><input type="checkbox" checked={ma20} onChange={e=>setMa20(e.target.checked)}/> SMA 20</label><label><input type="checkbox" checked={ma50} onChange={e=>setMa50(e.target.checked)}/> SMA 50</label><label><input type="checkbox" checked={showRsi} onChange={e=>setShowRsi(e.target.checked)}/> RSI (14)</label>
   <form onSubmit={addCompare} className="technical-compare"><input aria-label="Compare ticker" placeholder="Compare ticker…" value={otherInput} onChange={e=>setOtherInput(e.target.value)}/><button type="submit">Compare</button></form>
   {compared.map((t,i)=><button key={t} type="button" className="technical-chip" style={{color:colors[i%colors.length]}} onClick={()=>setCompared(old=>old.filter(v=>v!==t))}>{t} ×</button>)}
  </div>
  {loading&&<p className="muted">Loading price history…</p>}{error&&<p className="muted">{error}</p>}
  {!loading&&points.length>1&&<div className="technical-plot">
   <svg ref={svg} viewBox={`0 0 ${w} ${h}`} onPointerMove={onMove} onPointerLeave={()=>setHover(null)} role="img" aria-label={ticker+" historical prices"}>
    {[0,1,2,3,4,5].map(i=>{const v=min+(max-min)*i/5;return <g key={i}><line x1={left} x2={w-right} y1={y(v)} y2={y(v)} stroke="#303a45"/><text x={w-right+12} y={y(v)+4} fill="#aebdce" fontSize="11">{axisFormat(v)}</text></g>})}
    <path d={path(referenceValues)} stroke="#42c96d" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
    {ma20&&<path d={path(plottedS20)} stroke="#f7b54c" strokeWidth="2" fill="none"/>}{ma50&&<path d={path(plottedS50)} stroke="#bf9bff" strokeWidth="2" fill="none"/>}
    {aligned.map(a=><path key={a.ticker} d={path(a.values)} stroke={a.color} strokeWidth="2" fill="none"/>)}
    {[0,1,2,3,4,5].map(i=>{const idx=Math.round(i*(points.length-1)/5);return <text key={i} x={x(idx)} y={h-9} textAnchor="middle" fontSize="12" fill="#aebdce">{range==="1D"||range==="5D"?new Date(points[idx].t*1000).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",timeZone:"America/New_York"}):new Date(points[idx].t*1000).toLocaleDateString("en-US",{month:"short",year:"2-digit",timeZone:"UTC"})}</text>})}
    {hover!==null&&<><line x1={x(hover)} x2={x(hover)} y1={top} y2={chartBottom} stroke="#aab8c9" strokeDasharray="4 5"/><circle cx={x(hover)} cy={y(referenceValues[hover])} r="5" fill="#42c96d" stroke="#101820" strokeWidth="2"/></>}
    {lineEnds.map(line=>{const v=line.values[line.last];if(v===null)return null;return <g key={line.ticker} transform={"translate("+(w-right+4)+","+Math.max(12,Math.min(chartBottom-12,y(v)))+")"}><rect x="0" y="-11" width={Math.max(42,line.ticker.length*8+12)} height="22" rx="5" fill="#1c2939" stroke={line.color} strokeWidth="1.2"/><text x="7" y="4" fill={line.color} fontSize="11" fontWeight="700">{line.ticker}</text></g>})}
   </svg>
   {hover!==null&&<div className="technical-tooltip" style={{left:Math.min(78,Math.max(1,x(hover)/w*100))+"%",top:"9%"}}><strong>{new Date(points[hover].t*1000).toLocaleString("en-US",{dateStyle:"medium",timeStyle:range==="1D"||range==="5D"?"short":undefined})}</strong><div>{ticker}: {axisFormat(referenceValues[hover])}</div>{ma20&&s20[hover]!==null&&<div>SMA20: {axisFormat(plottedS20[hover]!)}</div>}{ma50&&s50[hover]!==null&&<div>SMA50: {axisFormat(plottedS50[hover]!)}</div>}{aligned.map(a=><div key={a.ticker}>{a.ticker}: {a.values[hover]!==null?axisFormat(a.values[hover]!):"N/A"}</div>)}</div>}
  </div>}
  {!loading&&showRsi&&points.length>1&&<div className="technical-rsi"><div className="technical-rsi-label">RSI (14) {rs.at(-1)?.toFixed(2)??"N/A"}</div><svg viewBox={`0 0 ${w} 105`} role="img" aria-label="Relative strength index" onPointerMove={e=>{const box=e.currentTarget.getBoundingClientRect();const px=(e.clientX-box.left)/box.width*w;setHover(Math.max(0,Math.min(points.length-1,Math.round((px-left)/(w-left-right)*(points.length-1)))));}} onPointerLeave={()=>setHover(null)}>
   {[30,50,70].map(v=><g key={v}><line x1={left} x2={w-right} y1={99-v*.85} y2={99-v*.85} stroke="#6d7884" strokeDasharray="5 5"/><text x={w-right+12} y={103-v*.85} fill="#aebdce" fontSize="11">{v}</text></g>)}
   {rs.map((v,i)=>{if(i===0||v===null||rs[i-1]===null)return null;const prior=rs[i-1]!;const color=v>70?"#f06469":v<30?"#26d78c":"#d9e1ea";return <line key={i} x1={x(i-1)} y1={99-prior*.85} x2={x(i)} y2={99-v*.85} stroke={color} strokeWidth="1.45" strokeLinecap="round"/>})}
   {hover!==null&&<line x1={x(hover)} x2={x(hover)} y1="10" y2="99" stroke="#9ca9b7" strokeDasharray="4 5"/>}
  </svg>{hover!==null&&rs[hover]!==null&&<div className="technical-rsi-value">RSI: {rs[hover]!.toFixed(2)}</div>}</div>}
  <p className="muted small">Source: market price feed. RSI and moving averages are calculated on the selected interval. Comparisons switch all lines to percentage returns from the selected range's starting date. No volume displayed.</p>
 </div>;
}
