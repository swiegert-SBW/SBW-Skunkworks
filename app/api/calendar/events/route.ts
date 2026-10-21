import {NextRequest,NextResponse} from "next/server";
import directory from "@/data/ticker-company-names.json";
export const runtime="nodejs";
type EventType="Earnings Call"|"Earnings Release"|"IR Day"|"M&A Conference Call"|"FDA Announcement"|"Sell-Side Conference"|"Investor Presentation"|"Other";
type Found={id:string;ticker:string;type:EventType;title:string;date:string;time:string;url:string;notes:string;source:"verified"};
const months:Record<string,number>={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const names=directory as Record<string,string>;
const decode=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/\s+/g," ").trim();
const tag=(s:string,t:string)=>s.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+t+">","i"))?.[1]||"";
const cleanName=(ticker:string)=>String(names[ticker]||names[ticker.replace(/-/g,".")]||"").replace(/\b(Inc\.?|Corporation|Corp\.?|Ltd\.?|Limited|PLC|Co\.?|Class [A-Z]|Common Stock|Holdings?)\b/gi," ").replace(/[^a-zA-Z0-9 ]/g," ").replace(/\s+/g," ").trim();
const iso=(y:number,m:number,d:number)=>{const dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()+1===m&&dt.getUTCDate()===d?dt.toISOString().slice(0,10):""};
function dated(s:string,published:string){
 const match=s.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\b/i);
 if(match){const y=match[3]?Number(match[3]):new Date(published).getUTCFullYear();let date=iso(y,months[match[1].toLowerCase()],Number(match[2]));if(!match[3]&&date&&date<published.slice(0,10)){const n=iso(y+1,months[match[1].toLowerCase()],Number(match[2]));if(n&&Date.parse(n)-Date.parse(published)<120*86400000)date=n}return date}
 const numeric=s.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);return numeric?iso(+numeric[1],+numeric[2],+numeric[3]):"";
}
const kind=(title:string):EventType|null=>{if(/(?:earnings|financial results|quarterly results)/i.test(title)){if(/(?:call|webcast|conference call)/i.test(title))return "Earnings Call";return "Earnings Release"}if(/(?:investor day|analyst day|capital markets day|investor relations day)/i.test(title))return "IR Day";if(/(?:merger|acquisition|transaction)/i.test(title)&&/conference call/i.test(title))return "M&A Conference Call";if(/(?:FDA|PDUFA)/i.test(title)&&/decision|announcement/i.test(title))return "FDA Announcement";if(/(?:investor conference|healthcare conference|technology conference|financial services conference|sell.side conference|fireside chat)/i.test(title))return "Sell-Side Conference";if(/investor presentation/i.test(title))return "Investor Presentation";return null};
const matchCompany=(headline:string,ticker:string,company:string)=>{const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");const token=(s:string)=>new RegExp("(^|[^a-z0-9])"+escape(s)+"(?=$|[^a-z0-9])","i").test(headline);const first=company.split(" ").find(x=>x.length>=5);return !!(company.length>=5&&token(company)||first&&!/^(global|international|american|united|general|national|financial|technology|technologies|services|systems|group|capital|energy|medical|health|industrial)$/i.test(first)&&token(first)||ticker.length>=3&&token(ticker))};
async function query(ticker:string,from:string,to:string):Promise<Found[]>{
 const company=cleanName(ticker);if(!company||company.length<4)return [];
 const q='"'+company+'" (earnings OR "conference call" OR "investor day" OR "investor conference" OR "fireside chat" OR "capital markets day" OR "investor presentation") when:30d';
 try{
 const response=await fetch("https://news.google.com/rss/search?"+new URLSearchParams({q,hl:"en-US",gl:"US",ceid:"US:en"}),{next:{revalidate:21600},signal:AbortSignal.timeout(7500),headers:{"User-Agent":"Mozilla/5.0"}});
 if(!response.ok)return [];
 const xml=await response.text();const result:Found[]=[];
 for(const item of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)){
  const raw=item[1],source=decode(tag(raw,"source")),rawTitle=decode(tag(raw,"title")),title=rawTitle.endsWith(" - "+source)?rawTitle.slice(0,-source.length-3):rawTitle;
  const pub=decode(tag(raw,"pubDate")),url=decode(tag(raw,"link")),description=decode(tag(raw,"description")),type=kind(title);
  if(!type||!matchCompany(title,ticker,company)||!/(announce|schedule|host|participat|present|report|release|webcast|hold|attend|upcoming|set for|to speak|to join)/i.test(title))continue;
  if(!Number.isFinite(Date.parse(pub))||!url.startsWith("https://"))continue;
  const date=dated(title,pub)||dated(description,pub);
  if(!date||date<from||date>to||date<new Date().toISOString().slice(0,10))continue;
  result.push({id:"auto-"+ticker+"-"+date+"-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,60),ticker,type,title,date,time:"",url,notes:"Announced event · "+source+" · Exact time not confirmed from this feed",source:"verified"});
 }
 return result;
 }catch{return []}
}
type NasdaqRow={symbol?:unknown;time?:unknown};
async function nasdaq(from:string,to:string,symbols:string[]){
 const wanted=new Map(symbols.map(s=>[s.replace(/-/g,".").toUpperCase(),s]));
 const days:string[]=[];for(let n=Date.parse(from+"T00:00:00Z");n<=Date.parse(to+"T00:00:00Z");n+=86400000){const d=new Date(n);if(d.getUTCDay()>0&&d.getUTCDay()<6)days.push(d.toISOString().slice(0,10))}
 let index=0,successful=0,failed=0;const failedDates:string[]=[];const output:Found[]=[];
 await Promise.all(Array.from({length:Math.min(12,days.length)},async()=>{while(index<days.length){
 const date=days[index++];try{
 const response=await fetch("https://api.nasdaq.com/api/calendar/earnings?"+new URLSearchParams({date}),{headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36","Accept":"application/json, text/plain, */*","Origin":"https://www.nasdaq.com","Referer":"https://www.nasdaq.com/"},next:{revalidate:3600},signal:AbortSignal.timeout(6500)});
 if(!response.ok){failed++;failedDates.push(date);continue}
 const json=await response.json() as {data?:{rows?:NasdaqRow[]}};
 if(!Array.isArray(json?.data?.rows)){failed++;failedDates.push(date);continue}successful++;
 for(const row of json.data.rows){const symbol=typeof row.symbol==="string"?row.symbol.trim().toUpperCase().replace(/-/g,"."):"";const ticker=wanted.get(symbol);if(!ticker)continue;
 const period=typeof row.time==="string"?row.time:"";const session=/after|amc/i.test(period)?"After market close":/before|pre.market|bmo/i.test(period)?"Before market open":"Timing unconfirmed";
 output.push({id:"nasdaq-"+ticker+"-"+date,ticker,type:"Earnings Release",title:ticker+" Earnings Release",date,time:"",url:"https://www.nasdaq.com/market-activity/earnings",notes:"Nasdaq earnings calendar · "+session+" · Date may be estimated; confirm with company IR",source:"verified"});
 }
 }catch{failed++;failedDates.push(date)}
 }}));
 return {events:output,successful,failed,failedDates};
}

type EarningsRow={symbol:string;reportDate:string;fiscalDateEnding:string};
function parseCsv(source:string):string[][]{
 const rows:string[][]=[];let fields:string[]=[],value="",quoted=false;
 for(let i=0;i<source.length;i++){const ch=source[i];if(ch==='"'){if(quoted&&source[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(ch===","&&!quoted){fields.push(value);value=""}else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&source[i+1]==="\n")i++;fields.push(value);value="";if(fields.some(x=>x.trim()))rows.push(fields);fields=[]}else value+=ch}
 if(value||fields.length){fields.push(value);rows.push(fields)}return rows
}
async function alphaVantage(from:string,to:string,symbols:string[]):Promise<{events:Found[];status:string}>{
 const key=process.env.ALPHA_VANTAGE_API_KEY;
 if(!key)return {events:[],status:"Alpha Vantage API key not configured"};
 try{
 const response=await fetch("https://www.alphavantage.co/query?"+new URLSearchParams({function:"EARNINGS_CALENDAR",horizon:"12month",apikey:key}),{next:{revalidate:43200},signal:AbortSignal.timeout(14000)});
 if(!response.ok)return {events:[],status:"Alpha Vantage returned HTTP "+response.status};
 const body=await response.text();
 if(body.trimStart().startsWith("{"))return {events:[],status:"Alpha Vantage did not return earnings CSV (possible API quota or access restriction)"};
 const rows=parseCsv(body);const headings=(rows.shift()||[]).map(x=>x.trim().toLowerCase().replace(/^\uFEFF/,""));
 const symbolIndex=headings.indexOf("symbol"),dateIndex=headings.indexOf("reportdate");
 if(symbolIndex<0||dateIndex<0)return {events:[],status:"Alpha Vantage earnings CSV has an unexpected schema"};
 const wanted=new Map(symbols.map(s=>[s.replace(/-/g,".").toUpperCase(),s]));const events:Found[]=[];
 for(const row of rows){const raw=(row[symbolIndex]||"").trim().toUpperCase(),ticker=wanted.get(raw),date=(row[dateIndex]||"").trim();
 if(!ticker||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<from||date>to)continue;
 events.push({id:"alpha-"+ticker+"-"+date,ticker,type:"Earnings Release",title:ticker+" Earnings (Expected)",date,time:"",url:"https://www.alphavantage.co/",notes:"Alpha Vantage expected earnings date; check company IR to confirm",source:"verified"})}
 return {events,status:"Alpha Vantage earnings dates (estimated unless confirmed)"};
 }catch{return {events:[],status:"Alpha Vantage earnings request failed"}}
}
// Direct company IR sources are intentionally allowlisted. Never treat an unsourced headline as an IR event.
const irPages:Record<string,string>={TSLA:"https://ir.tesla.com/"};
async function officialIr(tickers:string[],from:string,to:string):Promise<Found[]>{
 const selected=tickers.filter(t=>irPages[t]);const results=await Promise.all(selected.map(async ticker=>{
 try{
 const url=irPages[ticker],response=await fetch(url,{next:{revalidate:21600},signal:AbortSignal.timeout(8000)});
 if(!response.ok)return [] as Found[];
 const html=await response.text(),matches=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)],events:Found[]=[];
 for(const match of matches){const row=match[1].replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/\s+/g," ").trim();
 const found=row.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+20\d{2}\b/i);
 if(!found)continue;const ms=Date.parse(found[0]);if(!Number.isFinite(ms))continue;const date=new Date(ms).toISOString().slice(0,10);if(date<from||date>to)continue;
 if(!/\b(Q[1-4]|earnings|quarter|webcast)\b/i.test(row))continue;
 events.push({id:"ir-"+ticker+"-"+date,ticker,type:"Earnings Release",title:ticker+" Earnings (Company IR)",date,time:"",url,notes:"Direct company investor relations calendar · Company-published date",source:"verified"});
 }
 return events;
 }catch{return [] as Found[]}
 }));return results.flat()
}
export async function GET(req:NextRequest){
 const p=req.nextUrl.searchParams,from=p.get("from")||"",to=p.get("to")||"";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||to<from||Date.parse(to)-Date.parse(from)>94*86400000)return NextResponse.json({error:"Invalid date range"},{status:400});
 const symbols=[...new Set((p.get("tickers")||"").split(",").map(x=>x.trim().toUpperCase().replace(/\./g,"-")).filter(x=>/^[A-Z0-9^-]{1,12}$/.test(x)))].slice(0,70);
 const [alpha,ir]=await Promise.all([alphaVantage(from,to,symbols),officialIr(symbols,from,to)]);
 const primary=alpha.events.length>0?alpha.events:(await nasdaq(from,to,symbols)).events;
 const irKeys=new Set(ir.map(e=>e.ticker+"|"+e.date));
 const unique=new Map<string,Found>();
 for(const e of primary)if(!irKeys.has(e.ticker+"|"+e.date))unique.set(e.ticker+"|"+e.date+"|"+e.type,e);
 for(const e of ir)unique.set(e.ticker+"|"+e.date+"|"+e.type,e);
 const events=[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.ticker.localeCompare(b.ticker)).slice(0,200);
 const status=alpha.events.length?"Alpha Vantage + official IR": "Nasdaq fallback + official IR";
 return NextResponse.json({events,checked:symbols.length,updatedAt:new Date().toISOString(),note:status+". "+alpha.status+". Broader IR events depend on available company-published calendars.",sources:{alpha:alpha.events.length,officialIr:ir.length,fallback:!alpha.events.length}},{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=1800"}});
}
