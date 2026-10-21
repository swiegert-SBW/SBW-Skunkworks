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
export async function GET(req:NextRequest){
 const p=req.nextUrl.searchParams,from=p.get("from")||"",to=p.get("to")||"";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||to<from||Date.parse(to)-Date.parse(from)>94*86400000)return NextResponse.json({error:"Invalid date range"},{status:400});
 const symbols=[...new Set((p.get("tickers")||"").split(",").map(x=>x.trim().toUpperCase().replace(/\./g,"-")).filter(x=>/^[A-Z0-9^-]{1,12}$/.test(x)))].slice(0,70);
 const results:Found[]=[];for(let i=0;i<symbols.length;i+=10){const group=await Promise.all(symbols.slice(i,i+10).map(t=>query(t,from,to)));results.push(...group.flat())}
 const seen=new Set<string>();const events=results.filter(e=>{const k=e.ticker+"|"+e.date+"|"+e.type+"|"+e.title.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,55);if(seen.has(k))return false;seen.add(k);return true}).slice(0,200);
 return NextResponse.json({events,checked:symbols.length,updatedAt:new Date().toISOString(),note:"Only explicitly dated public announcements found in the last 30 days. Coverage varies by company."},{headers:{"Cache-Control":"public, s-maxage=21600, stale-while-revalidate=86400"}});
}
