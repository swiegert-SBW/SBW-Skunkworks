import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const revalidate=0;
const SOURCE="https://www.edwardjones.com/us-en/market-news-insights/stock-market-news/daily-market-recap";
const decode=(s:string)=>s.replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&rsquo;|&#8217;/gi,"’").replace(/&ndash;|&#8211;/gi,"–").replace(/&mdash;|&#8212;/gi,"—").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/\s+/g," ").trim();
const plain=(s:string)=>decode(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," "));
type Entry={heading:string;detail:string};
function extract(html:string):{date:string;entries:Entry[]}{
 const dates=[...html.matchAll(/(?:Monday|Tuesday|Wednesday|Thursday|Friday),?\s*(?:<[^>]+>\s*)*\d{1,2}\/\d{1,2}\/20\d{2}\s*(?:a\.?m\.?|p\.?m\.?)/gi)];
 const start=dates.length?dates[0].index||0:0;
 const section=html.slice(start,start+45000);
 const entries:Entry[]=[];
 for(const match of section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)){
  const item=match[1];const text=plain(item);
  if(text.length<140||text.length>2200)continue;
  const strong=item.match(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/i);
  let heading=strong?plain(strong[1]):"";
  if(!heading){heading=text.split(/\s+[–—-]\s+/)[0]||""}
  if(heading.length<15||heading.length>160||!text.toLowerCase().includes(heading.toLowerCase().slice(0,12)))continue;
  const detail=text.slice(text.indexOf(heading)+heading.length).replace(/^[\s–—:-]+/,"").trim();
  if(detail.length<90)continue;
  if(entries.some(e=>e.heading===heading))continue;
  entries.push({heading,detail});
  if(entries.length>=3)break;
 }
 return {date:dates.length?plain(dates[0][0]):"",entries};
}
function summary(entries:Entry[]):string{
 // Preserve decimals, complete sentences, and the publisher's numerical context.
 return entries.slice(0,3).map(({heading,detail})=>{
  const title=heading.replace(/[.!?:;]+$/,"").trim();
  const sentences=detail.replace(/\s+/g," ").trim().split(/(?<=[.!?])\s+(?=[A-Z“])/).filter(s=>s.length>25);
  const first=sentences[0]||detail;
  const additional=sentences.slice(1).find(s=>/\d+(?:\.\d+)?%|\$\d|Treasury|earnings estimates|industrial production/i.test(s));
  return title+". "+[first,additional].filter((s):s is string=>typeof s==="string").map(s=>s.trim()).join(" ");
 }).join(" ");
}

export async function GET(){
 try{
  const r=await fetch(SOURCE,{headers:{"User-Agent":"Mozilla/5.0","Accept":"text/html"},cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!r.ok)return NextResponse.json({error:"Edward Jones unavailable"},{status:502});
  const {date,entries}=extract(await r.text());
  if(entries.length<2)return NextResponse.json({error:"Could not identify the latest recap bullet points"},{status:502});
  return NextResponse.json({summary:summary(entries),entries:entries.map(({heading,detail})=>({heading,detail})),date,url:SOURCE},{headers:{"Cache-Control":"no-store, no-cache, max-age=0, must-revalidate"}});
 }catch{return NextResponse.json({error:"Recap retrieval failed"},{status:502})}
}
