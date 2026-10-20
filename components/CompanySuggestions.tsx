"use client";
import {useEffect,useState} from "react";
type Result={ticker:string;name:string};
export default function CompanySuggestions({value,onSelect}:{value:string;onSelect:(ticker:string)=>void}){
 const [items,setItems]=useState<Result[]>([]);
 useEffect(()=>{
  if(!value.trim()){setItems([]);return}
  const controller=new AbortController();
  const timer=window.setTimeout(()=>{
   fetch("/api/company-search?q="+encodeURIComponent(value),{signal:controller.signal}).then(r=>r.json()).then(d=>setItems(Array.isArray(d.results)?d.results:[])).catch(()=>{});
  },150);
  return()=>{window.clearTimeout(timer);controller.abort()}
 },[value]);
 if(!items.length)return null;
 return <div role="listbox" style={{position:"absolute",zIndex:1000,top:"100%",left:0,right:0,background:"#162232",border:"1px solid #516078",borderRadius:6,maxHeight:300,overflowY:"auto",boxShadow:"0 8px 25px #0009"}}>
  {items.map(item=><button type="button" role="option" aria-selected={false} key={item.ticker} onMouseDown={e=>e.preventDefault()} onClick={()=>onSelect(item.ticker)} style={{display:"flex",width:"100%",padding:"10px 12px",gap:12,textAlign:"left",background:"transparent",color:"inherit",border:0,cursor:"pointer"}}><strong>{item.ticker}</strong><span>{item.name}</span></button>)}
 </div>;
}
