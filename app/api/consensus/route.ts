import {NextResponse} from "next/server";
export const runtime="nodejs";
type Stats={mean:number|null;low:number|null;high:number|null;analysts:number|null;prior:number|null};
type Forecast={label:string;revenue:Stats;eps:Stats};
const empty=():Stats=>({mean:null,low:null,high:null,analysts:null,prior:null});
const number=(raw:string):number|null=>{const s=raw.replace(/,/g,"").trim();if(!s||s==="--"||s==="N/A")return null;const m=s.match(/^(-?\d+(?:\.\d+)?)\s*([TBMK])?$/i);if(!m)return null;return Number(m[1])*({T:1e12,B:1e9,M:1e6,K:1}[m[2]?.toUpperCase() as "T"|"B"|"M"|"K"]||1)};
const plain=(s:string)=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&#x27;|&#39;/gi,"'").replace(/\s+/g," ").trim();
function section(html:string,title:string){const at=html.indexOf(title);if(at<0)return null;const start=html.indexOf("<table",at);if(start<0||start-at>18000)return null;const end=html.indexOf("</table>",start);if(end<0)return null;return html.slice(start,end+8)}
function rows(table:string|null){if(!table)return [] as string[][];return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map(c=>plain(c[1])))}
function get(rows:string[][],label:string,index:number){const r=rows.find(row=>row[0]?.toLowerCase()===label.toLowerCase());return r?number(r[index+1]||""):null}
function parseStats(rows:string[][],i:number,priorLabel:string):Stats{return {mean:get(rows,"Avg. Estimate",i),low:get(rows,"Low Estimate",i),high:get(rows,"High Estimate",i),analysts:get(rows,"No. of Analysts",i),prior:get(rows,priorLabel,i)}}
export async function GET(req:Request){
 const ticker=(new URL(req.url).searchParams.get("ticker")||"").toUpperCase();
 if(!/^[A-Z0-9.^-]{1,15}$/.test(ticker))return NextResponse.json({error:"Invalid ticker"},{status:400});
 const source="https://finance.yahoo.com/quote/"+encodeURIComponent(ticker)+"/analysis/";
 try{
  const response=await fetch(source,{headers:{"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36","Accept":"text/html,application/xhtml+xml","Accept-Language":"en-US,en;q=0.9"},next:{revalidate:3600},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error("Yahoo Finance HTTP "+response.status);
  const html=await response.text();
  const revenueRows=rows(section(html,"Revenue Estimate")),epsRows=rows(section(html,"Earnings Estimate"));
  if(!revenueRows.length&&!epsRows.length)throw Error("Yahoo Finance did not expose the estimates tables");
  const header=revenueRows[0]?.length>1?revenueRows[0]:epsRows[0];
  const labels=["Current quarter","Next quarter","Current fiscal year","Next fiscal year"];
  const forecast:Forecast[]=labels.map((fallback,i)=>({label:header?.[i+1]||fallback,revenue:revenueRows.length?parseStats(revenueRows,i,"Year Ago Sales"):empty(),eps:epsRows.length?parseStats(epsRows,i,"Year Ago EPS"):empty()}));
  const historyRows=rows(section(html,"Earnings History"));
  const historical=historyRows[0]?.slice(1).map((label,i)=>({label,estimate:get(historyRows,"EPS Est.",i),actual:get(historyRows,"EPS Actual",i)}))||[];
  return NextResponse.json({ticker,annual:forecast.slice(2),quarterly:forecast.slice(0,2),historical,source,sourceName:"Yahoo Finance",notice:"Yahoo Finance public consensus. Historical EPS is reported separately. Standard deviations are not published. Figures may be unavailable if Yahoo restricts automated access."},{headers:{"Cache-Control":"public, s-maxage=3600"}});
 }catch(e){return NextResponse.json({ticker,annual:[],quarterly:[],historical:[],source,sourceName:"Yahoo Finance",notice:"Yahoo Finance estimates are temporarily inaccessible. No values have been estimated.",error:e instanceof Error?e.message:"Unavailable"},{headers:{"Cache-Control":"public, s-maxage=300"}})}
}
