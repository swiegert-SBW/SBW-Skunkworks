import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
type Story={title:string;url:string;source:string;published:string;description:string};
const decode=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
const tag=(s:string,t:string)=>s.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+t+">","i"))?.[1]||"";
async function feed(query:string,limit:number):Promise<Story[]>{
 const url="https://news.google.com/rss/search?"+new URLSearchParams({q:query,hl:"en-US",gl:"US",ceid:"US:en"});
 try{
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"},next:{revalidate:600},signal:AbortSignal.timeout(9000)});
  if(!r.ok)return [];
  const xml=await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,limit*3).map(m=>{
   const item=m[1],rawTitle=decode(tag(item,"title")),source=decode(tag(item,"source"))||"Google News";
   return {title:rawTitle.replace(new RegExp(" - "+source.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"$"),""),url:decode(tag(item,"link")),source,published:decode(tag(item,"pubDate")),description:decode(tag(item,"description"))};
  }).filter(x=>x.title&&x.url.startsWith("https://")).slice(0,limit);
 }catch{return []}
}
export async function GET(req:NextRequest){
 const p=req.nextUrl.searchParams;
 const symbols=[...new Set((p.get("tickers")||"").split(",").map(x=>x.trim().toUpperCase().replace(/\./g,"-")).filter(x=>/^[A-Z0-9^-]{1,12}$/.test(x)))].slice(0,100);
 const [market,companies]=await Promise.all([
  feed("(stock market OR Wall Street OR Federal Reserve OR inflation OR economy) when:1d",15),
  symbols.length?feed("("+symbols.slice(0,12).map(t=>'"'+t.replace(/-/g,".")+'"').join(" OR ")+") (stock OR earnings OR shares) when:3d",30):Promise.resolve([])
 ]);
 const now=Date.now(),upcoming:any[]=[];
 // Public weekly calendar feed, no API key. Never invent actual/consensus data.
 try{
  const r=await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json",{next:{revalidate:1800},signal:AbortSignal.timeout(9000)});
  if(r.ok){const rows=await r.json();if(Array.isArray(rows))for(const e of rows){
   const time=Date.parse(String(e.date||""));
   if(e.country==="USD"&&Number.isFinite(time)&&time>=now&&time<now+14*86400000){
    upcoming.push({time:new Date(time).toISOString(),name:String(e.title||""),actual:String(e.actual||""),previous:String(e.previous||""),consensus:String(e.forecast||""),impact:String(e.impact||"")});
   }
  }}
 }catch{}
 upcoming.sort((a,b)=>a.time.localeCompare(b.time));
 return NextResponse.json({market,companies,upcoming:upcoming.slice(0,70),updatedAt:new Date().toISOString(),calendarSource:"Fair Economy / Forex Factory public calendar",newsSource:"Google News RSS (publisher-linked headlines)",watchlistSymbolsSearched:symbols.slice(0,12)}, {headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}});
}
