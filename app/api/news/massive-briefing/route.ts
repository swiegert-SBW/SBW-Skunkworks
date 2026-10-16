import {NextResponse} from "next/server";
export const runtime="nodejs";
type Insight={ticker?:string;sentiment?:string;sentiment_reasoning?:string};
type Article={title?:string;description?:string;published_utc?:string;publisher?:{name?:string};insights?:Insight[]};
type MassiveResponse={results?:Article[]};
const compact=(s:string)=>s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
const themes=[
 {name:"the economy and monetary policy",re:/fed|inflation|cpi|ppi|treasur|yield|interest rate|economic|recession|jobs|employment|retail sales/i},
 {name:"equity-market performance",re:/stock market|wall street|s&p 500|nasdaq|dow jones|equities|stocks|index|market selloff|market rally/i},
 {name:"corporate earnings",re:/earnings|quarterly results|revenue|profit|guidance|sales growth|forecasts/i},
 {name:"technology and AI",re:/artificial intelligence|\bai\b|semiconductor|chipmaker|data center|nvidia|microsoft|amazon|apple|alphabet/i},
 {name:"global markets and commodities",re:/tariff|trade war|crude|oil prices|opec|currency|dollar|china|geopolit/i}
];
function brief(articles:Article[]){
 const recent=articles.filter(a=>a.title&&a.description).slice(0,40);
 const groups=new Map<string,Article[]>();
 for(const article of recent){const text=compact((article.title||"")+" "+(article.description||""));const theme=themes.find(t=>t.re.test(text))?.name||"other business developments";const arr=groups.get(theme)||[];if(arr.length<2)arr.push(article);groups.set(theme,arr)}
 const parts:string[]=[];
 for(const [theme,items] of groups){if(parts.length>=4)break;const points=items.map(a=>{
  const d=compact(a.description||"").replace(/[.!?]+$/,"");
  return d.length>210?d.slice(0,207).replace(/\s+\S*$/,"")+"…":d;
 }).filter(Boolean);if(!points.length)continue;
 const lead=parts.length===0?"Recent market reporting centers on ":"Coverage of ";
 parts.push(lead+theme+": "+points.join(" In related reporting, ")+".");
 }
 return parts.join(" ").slice(0,1800);
}
export async function GET(){
 const key=process.env.MASSIVE_API_KEY||process.env.POLYGON_API_KEY;
 if(!key)return NextResponse.json({error:"Massive API key not configured"},{status:503});
 try{
  const url=new URL("https://api.massive.com/v2/reference/news");
  url.searchParams.set("limit","80");url.searchParams.set("order","desc");url.searchParams.set("sort","published_utc");
  url.searchParams.set("published_utc.gte",new Date(Date.now()-36*3600000).toISOString().slice(0,10));
  const response=await fetch(url,{headers:{"Authorization":"Bearer "+key},next:{revalidate:3600},signal:AbortSignal.timeout(12000)});
  if(!response.ok)return NextResponse.json({error:"Massive news unavailable",status:response.status},{status:502});
  const data=await response.json() as MassiveResponse;
  const articles=(data.results||[]).filter(a=>a.title&&a.description);
  const summary=brief(articles);
  if(!summary)return NextResponse.json({error:"No usable article descriptions"},{status:404});
  return NextResponse.json({summary,source:"Massive news API",articles:articles.length,updatedAt:new Date().toISOString()},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=3600"}});
 }catch{return NextResponse.json({error:"Massive news request failed"},{status:502})}
}
