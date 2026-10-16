import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export const maxDuration=30;
export async function GET(req:NextRequest){
 const symbols=[...new Set((req.nextUrl.searchParams.get("symbols")||"").split(",").map(s=>s.trim().toUpperCase().replace(/\./g,"-")).filter(s=>/^[A-Z0-9-]{1,12}$/.test(s)))].slice(0,40);
 const caps:Record<string,number>={};
 if(!symbols.length)return NextResponse.json({caps});
 for(const host of ["query1.finance.yahoo.com","query2.finance.yahoo.com"]){
  try{
   const r=await fetch("https://"+host+"/v7/finance/quote?symbols="+encodeURIComponent(symbols.join(",")),{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"},next:{revalidate:3600},signal:AbortSignal.timeout(6000)});
   if(!r.ok)continue;
   const j=await r.json();
   for(const q of j?.quoteResponse?.result||[]){const ticker=String(q.symbol||"").toUpperCase().replace(/\./g,"-");if(symbols.includes(ticker)&&typeof q.marketCap==="number"&&Number.isFinite(q.marketCap)&&q.marketCap>0)caps[ticker]=q.marketCap}
   if(Object.keys(caps).length===symbols.length)break;
  }catch{}
 }
 return NextResponse.json({caps},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=3600"}});
}