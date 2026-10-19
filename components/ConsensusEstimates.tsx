"use client";
import {useEffect,useState} from "react";
type Stats={mean:number|null;low:number|null;high:number|null;analysts:number|null;prior:number|null};
type Forecast={label:string;revenue:Stats;eps:Stats};
type History={label:string;estimate:number|null;actual:number|null};
type Payload={annual:Forecast[];quarterly:Forecast[];historical:History[];source:string;sourceName:string;notice:string};
type Metric="revenue"|"grossProfit"|"grossMargin"|"operatingIncome"|"operatingMargin"|"ebitda"|"pretaxIncome"|"netIncome"|"netMargin"|"eps"|"operatingCashFlow"|"capex"|"freeCashFlow"|"dividend";
const groups:{label:string;items:{id:Metric;label:string;percent?:boolean}[]}[]=[
 {label:"Income",items:[{id:"revenue",label:"Revenue"},{id:"grossProfit",label:"Gross profit"},{id:"grossMargin",label:"Gross margin",percent:true},{id:"operatingIncome",label:"Operating income (EBIT)"},{id:"operatingMargin",label:"Operating margin",percent:true},{id:"ebitda",label:"EBITDA"},{id:"pretaxIncome",label:"Pre-tax income"},{id:"netIncome",label:"Net income"},{id:"netMargin",label:"Net profit margin",percent:true},{id:"eps",label:"Earnings per share"}]},
 {label:"Cash flow & capex",items:[{id:"operatingCashFlow",label:"Operating cash flow"},{id:"capex",label:"Capital expenditures"},{id:"freeCashFlow",label:"Free cash flow"}]},
 {label:"Dividends",items:[{id:"dividend",label:"Dividend per share"}]}
];
const format=(v:number|null,metric:Metric,percent=false)=>v===null||!Number.isFinite(v)?"—":percent?v.toFixed(1)+"%":metric==="eps"||metric==="dividend"?"$"+v.toFixed(2):Math.abs(v)>=1e12?"$"+(v/1e12).toFixed(2)+"T":Math.abs(v)>=1e9?"$"+(v/1e9).toFixed(2)+"B":Math.abs(v)>=1e6?"$"+(v/1e6).toFixed(1)+"M":"$"+v.toFixed(0);
type Column={key:string;label:string;kind:"actual"|"forecast";revenue:Stats|null;eps:Stats|null};
const missing:Stats={mean:null,low:null,high:null,analysts:null,prior:null};
export default function ConsensusEstimates({ticker}:{ticker:string}){
 const [data,setData]=useState<Payload|null>(null),[mode,setMode]=useState<"annual"|"quarterly">("annual"),[group,setGroup]=useState(0);
 useEffect(()=>{const ctl=new AbortController();setData(null);fetch("/api/consensus?ticker="+encodeURIComponent(ticker),{signal:ctl.signal}).then(r=>r.json()).then(setData).catch(()=>setData(null));return()=>ctl.abort()},[ticker]);
 const forecast=data?.[mode]||[];
 const history:Column[]=mode==="quarterly"?(data?.historical||[]).map((h,i)=>({key:"h"+i,label:h.label,kind:"actual",revenue:null,eps:{...missing,mean:h.actual}})):[];
 const columns:Column[]=[...history,...forecast.map((f,i)=>({key:"f"+i,label:f.label,kind:"forecast" as const,revenue:f.revenue,eps:f.eps}))];
 // Keep the requested full table visible even if Yahoo blocks requests. These are empty placeholders, never invented estimates.
 if(!columns.length){const year=new Date().getFullYear();const fallback=mode==="annual"?[year-2,year-1,year,year+1,year+2,year+3,year+4,year+5].map((y,i)=>({key:"s"+i,label:"FY "+y,kind:i<2?"actual" as const:"forecast" as const,revenue:null,eps:null})):[-4,-3,-2,-1,0,1,2,3,4].map((q,i)=>{const d=new Date();d.setMonth(d.getMonth()+q*3);return {key:"s"+i,label:"Q"+(Math.floor(d.getMonth()/3)+1)+" "+d.getFullYear(),kind:i<4?"actual" as const:"forecast" as const,revenue:null,eps:null}});columns.push(...fallback)}
 const rows=groups[group].items;
 return <div className="panel consensus-panel"><div className="stmt-head"><div><h2>{ticker} Analyst Estimates by Fiscal Period</h2><p className="muted small">Recent actuals precede forecasts. Values appear only when provided by the data source.</p></div><div className="consensus-controls"><div className="consensus-segment" role="group" aria-label="Fiscal period"><button className={mode==="annual"?"active":""} onClick={()=>setMode("annual")}>Yearly</button><button className={mode==="quarterly"?"active":""} onClick={()=>setMode("quarterly")}>Quarterly</button></div><div className="consensus-segment" role="group" aria-label="Financial category">{groups.map((g,i)=><button key={g.label} className={group===i?"active":""} onClick={()=>setGroup(i)}>{g.label}</button>)}</div></div></div>
 <div className="table-wrap consensus-grid-wrap"><table className="stmt consensus-grid"><thead><tr><th className="consensus-metric-col">Metric</th>{columns.map(c=><th key={c.key}>{c.label}<span className="consensus-col-type">{c.kind==="actual"?"Actual":"Forecast"}</span></th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td className="consensus-metric-col">{r.label}</td>{columns.map(c=>{const st=r.id==="revenue"?c.revenue:r.id==="eps"?c.eps:null;const value=st?.mean??null;const details=st&&c.kind==="forecast"&&[st.low!==null?"Low: "+format(st.low,r.id):null,st.high!==null?"High: "+format(st.high,r.id):null,st.analysts!==null?"Analysts: "+st.analysts:null].filter(Boolean).join(" | ");return <td key={c.key} className={c.kind==="actual"?"consensus-actual":""} title={details||undefined}><strong>{format(value,r.id,r.percent)}</strong>{value!==null&&st?.prior!==null&&st?.prior!==undefined&&st.prior!==0&&<span className="consensus-yoy">{((value/st.prior-1)*100).toFixed(1)}% YoY</span>}</td>})}</tr>)}</tbody></table></div>
 <p className="muted small consensus-source">{data?.notice||"Loading Yahoo Finance estimates…"} {data?.source&&<a href={data.source} target="_blank" rel="noopener noreferrer">Yahoo Finance ↗</a>} {!data&&"Forecast columns are placeholders until the source responds."}</p></div>;
}
