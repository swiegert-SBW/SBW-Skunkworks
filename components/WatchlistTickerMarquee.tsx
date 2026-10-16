"use client";
import {useEffect,useRef,useState} from "react";
type Watchlist={id:string;name:string;tickers:string[]};
type Tile={ticker:string;name:string;marketCap:number;change:number;price:number|null;quoteAvailable?:boolean};
const KEY="sbw-workstation-watchlists-v1";
const SELECTED_KEY="sbw-selected-watchlist-id";
const clean=(s:string)=>s.trim().toUpperCase().replace(/\./g,"-");
function fmt(v:number|null|undefined){return typeof v==="number"&&Number.isFinite(v)?v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}
export default function WatchlistTickerMarquee(){
 const[tiles,setTiles]=useState<Tile[]>([]);
 const previousQuotes=useRef(new Map<string,Tile>());
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
    setReady(true);
    const cached=previousQuotes.current;
    setTiles(symbols.map(ticker=>cached.get(ticker)||{ticker,name:ticker,marketCap:0,change:0,price:null,quoteAvailable:false}));
    const pages=Array.from({length:Math.ceil(symbols.length/100)},(_,i)=>symbols.slice(i*100,(i+1)*100));
    void Promise.allSettled(pages.map(async(page,i)=>{
     if(i)await new Promise(resolve=>window.setTimeout(resolve,i*500));
     for(let attempt=0;attempt<3;attempt++){
      try{
       const response=await fetch("/api/heatmap?"+new URLSearchParams({index:"watchlist",period:"1d",tickers:page.join(","),limit:"100"}),{cache:"no-store"});
       if(!response.ok)throw Error("Quote data unavailable");
       const data=await response.json();
       if(!live||version!==request)return;
       for(const tile of (data.tiles||[]) as Tile[]){
        if(tile.quoteAvailable&&typeof tile.price==="number"&&Number.isFinite(tile.price)&&tile.name)cached.set(tile.ticker,tile);
       }
       setTiles(symbols.map(ticker=>cached.get(ticker)||{ticker,name:ticker,marketCap:0,change:0,price:null,quoteAvailable:false}));
       if(((data.tiles||[]) as Tile[]).every(tile=>tile.quoteAvailable))return;
       if(attempt<2)await new Promise(resolve=>window.setTimeout(resolve,2200));
      }catch{if(attempt<2)await new Promise(resolve=>window.setTimeout(resolve,2500));}
     }
    }));
   }catch{setReady(true)}
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
