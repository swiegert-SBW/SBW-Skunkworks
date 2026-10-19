import {NextResponse} from "next/server";
export const runtime="nodejs";
const num=(s:string)=>{const m=s.replace(/,/g,"").match(/(-?\d+(?:\.\d+)?)\s*([TBMK])?/i);if(!m)return null;const n=Number(m[1]);return Number.isFinite(n)?n*({T:1e12,B:1e9,M:1e6,K:1}[m[2]?.toUpperCase() as "T"|"B"|"M"|"K"]||1):null};
export async function GET(req:Request){
 const ticker=(new URL(req.url).searchParams.get("ticker")||"").toLowerCase();
 if(!/^[a-z0-9.-]{1,12}$/.test(ticker))return NextResponse.json({error:"Invalid ticker"},{status:400});
 const source="https://stockanalysis.com/stocks/"+encodeURIComponent(ticker)+"/forecast/";
 try{
  const response=await fetch(source,{headers:{"User-Agent":"Mozilla/5.0 (compatible; SBWWorkstation/1.0)","Accept":"text/html"},next:{revalidate:21600},signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw Error("Forecast unavailable");
  const html=await response.text();
  const clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ");
  const field=(label:string)=>{const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");const match=clean.match(new RegExp(escaped+"\\s+(-?[\\d,.]+\\s*[TBMK]?)","i"));return match?num(match[1]):null};
  const annual=[{label:"This fiscal year",revenue:field("Revenue This Year"),eps:field("EPS This Year")},{label:"Next fiscal year",revenue:field("Revenue Next Year"),eps:field("EPS Next Year")}];
  return NextResponse.json({ticker:ticker.toUpperCase(),annual,source,sourceName:"Stock Analysis / S&P Global Market Intelligence",updatedAt:new Date().toISOString(),notice:"Only freely visible forecast figures. Analyst counts, dispersion and quarter estimates are unavailable from this source."},{headers:{"Cache-Control":"public, s-maxage=21600"}});
 }catch{return NextResponse.json({ticker:ticker.toUpperCase(),annual:[],source,sourceName:"Stock Analysis",notice:"Free consensus feed temporarily unavailable"},{status:200})}
}
