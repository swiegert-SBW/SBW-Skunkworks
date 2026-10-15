"use client";
import {useEffect,useState} from "react";
type Watchlist={id:string;name:string;tickers:string[]};
type Tile={ticker:string;name:string;marketCap:number;change:number;price:number|null;quoteAvailable?:boolean};
const KEY="sbw-workstation-watchlists-v1";
const SELECTED_KEY="sbw-selected-watchlist-id";
const clean=(s:string)=>s.trim().toUpperCase().replace(/\./g,"-");
function fmt(v:number|null|undefined){return typeof v==="number"&&Number.isFinite(v)?v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}
export default function WatchlistTickerMarquee(){
 const[tiles,setTiles]=useState<Tile[]>([]);
 const[listName,setListName]=useState("");
 const[ready,setReady]=useState(false);
 useEffect(()=>{
  let live=true,request=0;
  const read=()=>{
   const version=++request;
   try{
    const lists=JSON.parse(localStorage.getItem(KEY)||"[]") as Watchlist[];
    const id=localStorage.getItem(SELECTED_KEY)||"";
    const chosen=lists.find(l=>l.id===id)||lists[0];
    setListName(chosen?.name||"");
    const symbols=[...new Set((chosen?.tickers||[]).map(clean).filter(Boolean))].slice(0,300);
    if(!symbols.length){setTiles([]);setReady(true);return}
    // Show symbols immediately, without waiting for remote quotes.
    setTiles(previous=>symbols.map(ticker=>previous.find(t=>t.ticker===ticker)||{ticker,name:"",marketCap:0,change:0,price:null,quoteAvailable:false}));
    setReady(true);
    const pages=Array.from({length:Math.ceil(symbols.length/25)},(_,i)=>symbols.slice(i*25,(i+1)*25));
    void Promise.all(pages.map(async page=>{
     const response=await fetch("/api/heatmap?"+new URLSearchParams({index:"watchlist",period:"1d",tickers:page.join(","),limit:"25"}));
     if(!response.ok)throw Error("Quote data unavailable");
     const data=await response.json();
     return (data.tiles||[]) as Tile[];
    })).then(groups=>{
     if(!live||version!==request)return;
     const quotes=new Map(groups.flat().map(t=>[t.ticker,t]));
     setTiles(symbols.map(ticker=>quotes.get(ticker)||{ticker,name:"",marketCap:0,change:0,price:null,quoteAvailable:false}));
    }).catch(()=>{ /* Keep the ticker symbols visible if quote requests fail. */ });
   }catch{setTiles([]);setListName("");setReady(true)}
  };
  read();
  window.addEventListener("storage",read);
  window.addEventListener("sbw-watchlists-updated",read);
  const timer=window.setInterval(read,120000);
  return()=>{live=false;request++;window.removeEventListener("storage",read);window.removeEventListener("sbw-watchlists-updated",read);window.clearInterval(timer)};
 },[]);
 const render=(copy:number)=>tiles.map(t=><div className="tick" key={copy+"-"+t.ticker} title={t.name?t.name+" ("+t.ticker+")":t.ticker}><span className="tick-label">{t.ticker}</span><span className="tick-val">{fmt(t.price)}</span><span className={"tick-chg "+(t.change<0?"neg":"pos")}>{t.quoteAvailable===false?"—":(t.change>=0?"+":"")+(Number.isFinite(t.change)?t.change:0).toFixed(2)+"%"}</span>{t.name&&<span className="tick-company">{t.name}</span>}</div>);
 return <div className="watchlist-marquee" aria-label={"Selected watchlist quotes"+(listName?" for "+listName:"")} title={listName?"Watchlist: "+listName:"Select or create a watchlist in the Watchlist tab"}>{!ready||!tiles.length?<div className="watchlist-marquee-empty">{ready?(listName?"No symbols in "+listName:"Select a watchlist to show its quotes"):"Loading watchlist…"}</div>:<div className="watchlist-marquee-track" style={{"--ticker-duration":Math.max(20,tiles.length*4)+"s"} as React.CSSProperties}>{render(0)}{render(1)}</div>}</div>;
}
