import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const symbols=(req.nextUrl.searchParams.get("symbols")||"").split(",").map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z0-9-]{1,12}$/.test(x)).slice(0,80);
 if(!symbols.length)return NextResponse.json({quotes:{}});
 const quotes:Record<string,number|null>={};
 for(const ticker of symbols)quotes[ticker]=null;
 try{
  const url="https://query1.finance.yahoo.com/v7/finance/spark?"+new URLSearchParams({symbols:symbols.join(","),range:"5d",interval:"1d"});
  const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"},next:{revalidate:300},signal:AbortSignal.timeout(8000)});
  if(res.ok){
   const data=await res.json();
   for(const t of symbols){
    const item=data[t]||data[t.replace(/-/g,".")];
    const obj=item?.response?.[0]||item?.chart?.result?.[0];
    const closes=(obj?.indicators?.quote?.[0]?.close||[]).filter((x:unknown)=>typeof x==="number"&&Number.isFinite(x));
    const price=Number(obj?.meta?.regularMarketPrice??closes[closes.length-1]);
    const previous=Number(obj?.meta?.chartPreviousClose??obj?.meta?.previousClose??closes[closes.length-2]);
    if(price>0&&previous>0)quotes[t]=(price/previous-1)*100;
   }
  }
 }catch{}
 return NextResponse.json({quotes},{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}});
}
