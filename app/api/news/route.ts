import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
type Story={title:string;url:string;source:string;published:string;description:string};
type CalendarItem={time:string;name:string;actual:string;previous:string;consensus:string;impact:string};
const decode=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
const tag=(s:string,t:string)=>s.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+t+">","i"))?.[1]||"";
const ALLOWED=[/\bcnbc\b/i,/\bbarron['’]?s\b/i,/\bwall street journal\b/i,/\bwsj\b/i,/\bpr newswire\b/i,/\bbusiness wire\b/i,/\bglobenewswire\b/i,/\baccesswire\b/i,/\bnewsfile\b/i];
const publisherQuery="(site:cnbc.com OR site:barrons.com OR site:wsj.com OR site:prnewswire.com OR site:businesswire.com OR site:globenewswire.com OR site:accesswire.com OR site:newsfilecorp.com)";
async function feed(query:string,limit:number):Promise<Story[]>{
 const url="https://news.google.com/rss/search?"+new URLSearchParams({q:query,hl:"en-US",gl:"US",ceid:"US:en"});
 try{
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"},next:{revalidate:600},signal:AbortSignal.timeout(11000)});
  if(!r.ok)return [];
  const xml=await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,limit*3).map(m=>{
   const item=m[1],rawTitle=decode(tag(item,"title")),source=decode(tag(item,"source"))||"Google News";
   return {title:rawTitle.endsWith(" - "+source)?rawTitle.slice(0,-source.length-3):rawTitle,url:decode(tag(item,"link")),source,published:decode(tag(item,"pubDate")),description:decode(tag(item,"description"))};
  }).filter(x=>x.title&&x.url.startsWith("https://")).slice(0,limit);
 }catch{return []}
}
const dedupe=(items:Story[])=>{const seen=new Set<string>();return items.filter(s=>{const key=s.title.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,120);if(seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>(Date.parse(b.published)||0)-(Date.parse(a.published)||0))};
export async function GET(req:NextRequest){
 const p=req.nextUrl.searchParams;
 const symbols=[...new Set((p.get("tickers")||"").split(",").map(x=>x.trim().toUpperCase().replace(/\./g,"-")).filter(x=>/^[A-Z0-9^=-]{1,12}$/.test(x)))];
 // Query every symbol in small groups to avoid long, truncated search expressions.
 // Batch requests to keep serverless concurrency reasonable; individual failures do not hide other symbols.
 const groups:string[][]=[];for(let i=0;i<symbols.length;i+=6)groups.push(symbols.slice(i,i+6));
 const [market,...companyGroups]=await Promise.all([
  feed("(stock market OR Wall Street OR Federal Reserve OR inflation OR economy) when:1d",24),
  ...groups.map(async group=>{
   const term=group.map(t=>'"'+t.replace(/-/g,".")+'"').join(" OR ");
   const query="("+term+") "+publisherQuery+" when:7d";
   return (await feed(query,35)).filter(s=>ALLOWED.some(rx=>rx.test(s.source)));
  })
 ]);
 const companies=dedupe(companyGroups.flat()).slice(0,100);
 const now=Date.now(),upcoming:CalendarItem[]=[];
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
 return NextResponse.json({market:dedupe(market).slice(0,24),companies,upcoming:upcoming.slice(0,70),updatedAt:new Date().toISOString(),calendarSource:"Fair Economy / Forex Factory public calendar",newsSource:"Google News RSS (publisher-linked headlines)",watchlistSymbolsSearched:symbols}, {headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}});
}
