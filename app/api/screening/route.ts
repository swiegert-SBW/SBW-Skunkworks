import {NextResponse} from "next/server";
export const runtime="nodejs";
export const maxDuration=30;
type R=Record<string,unknown>;
const number=(x:unknown)=>{const s=String(x??"").replace(/[$,%\s]/g,"").replace(/,/g,"");if(!s||s==="--"||s==="N/A")return null;const suffix=s.slice(-1).toUpperCase(),n=Number(/[KMBT]$/.test(s)?s.slice(0,-1):s);if(!Number.isFinite(n))return null;return n*({K:1e3,M:1e6,B:1e9,T:1e12}[suffix]||1)};
export async function GET(){
 try{
  const url="https://api.nasdaq.com/api/screener/stocks?"+new URLSearchParams({tableonly:"true",limit:"6000",offset:"0"});
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36","Accept":"application/json, text/plain, */*","Origin":"https://www.nasdaq.com","Referer":"https://www.nasdaq.com/"},next:{revalidate:1800},signal:AbortSignal.timeout(18000)});
  if(!r.ok)throw Error("Nasdaq source returned HTTP "+r.status);
  const json=await r.json(),raw: R[]=json?.data?.table?.rows||[];
  if(!Array.isArray(raw)||raw.length<100)throw Error("Nasdaq did not return a usable stock universe");
  const results=raw.map(row=>({ticker:String(row.symbol||"").trim(),name:String(row.name||""),sector:String(row.sector||""),industry:String(row.industry||""),country:String(row.country||""),market_cap:number(row.marketCap),price:number(row.lastsale),change_percent:number(row.pctchange),change:number(row.netchange),volume:number(row.volume),ipo_date:String(row.ipoyear||""),exchange:String(row.exchange||""),raw:undefined})).filter(row=>/^[A-Z][A-Z0-9.\-]{0,11}$/.test(row.ticker));
  return NextResponse.json({results,provider:"Nasdaq public stock screener",total:results.length,reportedTotal:Number(json?.data?.table?.asOf)||results.length,updatedAt:new Date().toISOString()},{headers:{"Cache-Control":"public, s-maxage=1800, stale-while-revalidate=3600"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load stock universe"},{status:502})}
}
