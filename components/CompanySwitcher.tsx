"use client";
import CompanySuggestions from "@/components/CompanySuggestions";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useState} from "react";
export default function CompanySwitcher({ticker}:{ticker:string}){
 const router=useRouter(),pathname=usePathname(),[editing,setEditing]=useState(false),[value,setValue]=useState(ticker),[name,setName]=useState("");
 useEffect(()=>{const ctl=new AbortController();fetch("/api/company-identity?ticker="+encodeURIComponent(ticker),{signal:ctl.signal}).then(r=>r.json()).then(d=>setName(d.name||"")).catch(()=>{});return()=>ctl.abort()},[ticker]);
 const go=()=>{const next=value.trim().toUpperCase();if(!/^[A-Z0-9.^-]{1,12}$/.test(next)){setValue(ticker);setEditing(false);return;}const parts=pathname.split("/");parts[2]=encodeURIComponent(next);router.push(parts.join("/"));setEditing(false)};
 return <div className="company-switcher"><strong className="company-switcher-identity">{name?name+"  ":""}{ticker}</strong>{editing?<form style={{position:"relative"}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget)){setEditing(false);setValue(ticker)}}} onSubmit={e=>{e.preventDefault();go()}}><input autoFocus aria-label="Company ticker" value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==="Escape"){setEditing(false);setValue(ticker)}}} placeholder="Company or ticker" spellCheck={false}/><button type="submit">Go</button><CompanySuggestions value={value} onSelect={next=>{const parts=pathname.split("/");parts[2]=encodeURIComponent(next);router.push(parts.join("/"));setValue("");setEditing(false)}}/></form>:<button type="button" title="Switch ticker, keep current subpage" onClick={()=>{setValue(ticker);setEditing(true)}}><span>Switch company <span aria-hidden="true">⌄</span></span></button>}</div>;
}
