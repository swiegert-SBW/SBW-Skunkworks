"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {usePathname} from "next/navigation";
import {useEffect,useState} from "react";
import {NAV,href} from "@/lib/nav";
export default function Sidebar({ticker}:{ticker:string}){
 const router=useRouter();
 const parts=(usePathname()||"").split("/").filter(Boolean);
 const section=parts[2]??"overviews",sub=parts[3]??"snapshot";
 const [collapsed,setCollapsed]=useState<string[]>([]);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("sbw-company-nav-collapsed")||"[]");if(Array.isArray(saved))setCollapsed(saved)}catch{}},[]);
 const open=(id:string)=>setCollapsed(old=>{const next=old.filter(x=>x!==id);localStorage.setItem("sbw-company-nav-collapsed",JSON.stringify(next));return next});
 const toggle=(id:string)=>setCollapsed(old=>{const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];localStorage.setItem("sbw-company-nav-collapsed",JSON.stringify(next));return next});
 return <nav className="sidebar" aria-label="Company sections">{NAV.map(s=><div key={s.id} className="nav-group"><div className={"nav-section "+(s.id===section?"open":"")} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><button type="button" onClick={()=>{open(s.id);router.push(href(ticker,s.id,s.items[0].id))}} style={{flex:1,color:"inherit",textDecoration:"none",textAlign:"left",border:0,background:"transparent",cursor:"pointer",font:"inherit"}}>{s.label}</button><button type="button" aria-label={(collapsed.includes(s.id)?"Expand ":"Collapse ")+s.label} aria-expanded={!collapsed.includes(s.id)} onClick={()=>toggle(s.id)} style={{border:0,background:"transparent",color:"inherit",cursor:"pointer",padding:"4px 8px"}}>{collapsed.includes(s.id)?"▸":"▾"}</button></div>{!collapsed.includes(s.id)&&s.items.map(i=><Link key={i.id} href={href(ticker,s.id,i.id)} className={"nav-item "+(s.id===section&&i.id===sub?"active":"")}>{i.label}</Link>)}</div>)}</nav>;
}