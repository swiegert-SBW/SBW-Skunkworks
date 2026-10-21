"use client";
import {useEffect,useState} from "react";
type Result={data:unknown;error?:string|null;updatedAt?:string};
const label:Record<string,string>={dividends:"Dividend History",segments:"Revenue Segments",peers:"Peer Comparison",events:"Company Events"};
const mode:Record<string,string>={dividends:"dps",segments:"historic",peers:"default",events:"corporate"};
export default function BusinessQuantPanel({ticker,kind}:{ticker:string;kind:"dividends"|"segments"|"peers"|"events"}){
 const [result,setResult]=useState<Result|null>(null),[busy,setBusy]=useState(true),[refresh,setRefresh]=useState(0);
 useEffect(()=>{const ctl=new AbortController(),key="sbw-bq:"+kind+":"+ticker;setBusy(true);
  if(refresh===0){try{const cached=JSON.parse(localStorage.getItem(key)||"null");if(cached&&Date.now()-cached.saved<86400000){setResult(cached.result);setBusy(false);return}}catch{}}
  fetch("/api/businessquant?"+new URLSearchParams({kind,ticker,mode:mode[kind]}),{signal:ctl.signal,cache:refresh?"no-store":"default"}).then(r=>r.json()).then((v:Result)=>{setResult(v);if(v.data){try{localStorage.setItem(key,JSON.stringify({saved:Date.now(),result:v}))}catch{}}}).catch(()=>setResult({data:null,error:"Data request failed"})).finally(()=>setBusy(false));return()=>ctl.abort();
 },[ticker,kind,refresh]);
 const raw=result?.data;const rows=Array.isArray(raw)?raw:Array.isArray((raw as {rows?:unknown[]}|null)?.rows)?(raw as {rows:unknown[]}).rows:Array.isArray((raw as {results?:unknown[]}|null)?.results)?(raw as {results:unknown[]}).results:[];
 const flat=kind==="segments"?rows.flatMap((r:unknown)=>{const group=r as {category?:string;data?:unknown[]};return Array.isArray(group?.data)?group.data.map(item=>({...item as object,category:group.category})):[]}):rows;
 const records=flat.filter((r):r is Record<string,unknown>=>!!r&&typeof r==="object"&&!Array.isArray(r));const keys=Array.from(new Set(records.slice(0,5).flatMap(r=>Object.keys(r)))).slice(0,12);
 return <div className="panel"><div className="stmt-head"><div><h2>{ticker} · {label[kind]}</h2><p className="muted small">Business Quant · On-demand data · Cached for 24 hours</p></div><button className="news-refresh" disabled={busy} onClick={()=>setRefresh(n=>n+1)}>{busy?"Loading…":"↻ Refresh"}</button></div>
 {records.length>0?<div className="table-wrap"><table className="stmt"><thead><tr>{keys.map(k=><th key={k}>{k.replace(/_/g," ")}</th>)}</tr></thead><tbody>{records.slice(0,100).map((r,i)=><tr key={i}>{keys.map(k=><td key={k}>{r[k]===null||r[k]===undefined?"—":typeof r[k]==="object"?"—":String(r[k])}</td>)}</tr>)}</tbody></table></div>:<p className="muted small">{busy?"Loading available data…":result?.error||"No data returned for this company on the available Business Quant tier."}</p>}
 {kind==="events"&&<p className="muted small">Transcripts are not automatically downloaded. Open the source link in an event record when available.</p>}
 <p className="muted small">Last fetched: {result?.updatedAt?new Date(result.updatedAt).toLocaleString():"—"}</p></div>;
}
