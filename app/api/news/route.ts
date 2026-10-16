import directory from "@/data/ticker-company-names.json";
import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
type Story={title:string;url:string;source:string;published:string;description:string};
type CalendarItem={time:string;name:string;actual:string;previous:string;consensus:string;impact:string;reference?:string};
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
 const names=directory as Record<string,string>;
 const shortName=(t:string)=>String(names[t]||names[t.replace(/-/g,".")]||"").replace(/\\b(Inc\\.?|Corporation|Corp\\.?|Ltd\\.?|Limited|PLC|Co\\.?|Class [A-Z]|Common Stock|Holdings?)\\b/gi," ").replace(/[^a-zA-Z0-9 ]/g," ").replace(/\\s+/g," ").trim();
 const searchTerms=symbols.map(t=>({ticker:t,name:shortName(t)}));
 const batches:typeof searchTerms[]=[];for(let i=0;i<searchTerms.length;i+=4)batches.push(searchTerms.slice(i,i+4));
 const [market,...companyGroups]=await Promise.all([
  feed("(stock market OR Wall Street OR Federal Reserve OR inflation OR economy) when:1d",24),
  ...batches.map(async batch=>{
   const terms=batch.flatMap(s=>s.name.length>=5?['"'+s.name+'"','"'+s.ticker.replace(/-/g,".")+'"']:['"'+s.ticker.replace(/-/g,".")+'"']);
   return (await feed("("+terms.join(" OR ")+") "+publisherQuery+" when:7d",40)).filter(s=>ALLOWED.some(rx=>rx.test(s.source)));
  })
 ]);
 const escaped=(s:string)=>s.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&");
 const matches=(title:string,ticker:string,name:string)=>{
  const exact=(term:string)=>term.length>=2&&new RegExp("(^|[^A-Za-z0-9])"+escaped(term)+"(?=$|[^A-Za-z0-9])","i").test(title);
  if(name.length>=5&&exact(name))return 3;
  const core=name.split(" ").filter(w=>w.length>=5).slice(0,2).join(" ");
  if(core.length>=5&&exact(core))return 2;
  if(ticker.length>=3&&exact(ticker.replace(/-/g,".")))return 1;
  if(ticker.length>=3&&exact(ticker))return 1;
  return 0;
 };
 const companies=dedupe(companyGroups.flat()).map(story=>({story,score:Math.max(0,...searchTerms.map(s=>matches(story.title,s.ticker,s.name)))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||(Date.parse(b.story.published)||0)-(Date.parse(a.story.published)||0)).slice(0,100).map(x=>x.story);
 const now=new Date();
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const startDay=today;
 const endDay=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(now.getTime()+7*86400000));
 const upcoming:CalendarItem[]=[];
 let calendarSource="Trading Economics",calendarStatus="unavailable";
 const key=process.env.TRADING_ECONOMICS_API_KEY||"guest:guest";
 try{
  const url="https://api.tradingeconomics.com/calendar/country/united%20states/"+startDay+"/"+endDay+"?"+new URLSearchParams({c:key,f:"json"});
  const r=await fetch(url,{next:{revalidate:600},signal:AbortSignal.timeout(10000)});
  if(r.ok){
   const rows=await r.json();
   if(Array.isArray(rows)){
    for(const e of rows){
     if(e.Country!=="United States")continue;
     const raw=String(e.Date||"");
     const datePart=raw.slice(0,10);
     if(datePart<startDay||datePart>endDay)continue;
     // TE calendar timestamps are UTC in the official API. Do not use the browser's timezone.
     const date=Date.parse(raw.endsWith("Z")||/[+-]\\d\\d:\\d\\d$/.test(raw)?raw:raw+"Z");
     if(!Number.isFinite(date))continue;
     upcoming.push({time:new Date(date).toISOString(),name:String(e.Event||e.Category||""),actual:String(e.Actual||""),previous:String(e.Previous||""),consensus:String(e.Forecast||""),impact:String(e.Importance||""),reference:String(e.Reference||"")});
    }
    if(upcoming.length)calendarStatus="ok";
   }
  }
 }catch{}
 upcoming.sort((a,b)=>a.time.localeCompare(b.time));
 return NextResponse.json({market:dedupe(market).slice(0,24),companies,upcoming:upcoming.slice(0,150),updatedAt:new Date().toISOString(),calendarSource,calendarStatus,newsSource:"Google News RSS (publisher-linked headlines)",watchlistSymbolsSearched:symbols}, {headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}});
}
