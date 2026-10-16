import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export const maxDuration=60;

type ChartResult={meta?:{regularMarketPrice?:number;chartPreviousClose?:number;previousClose?:number;regularMarketPreviousClose?:number};indicators?:{quote?:Array<{close?:(number|null)[]}>}};
const valid=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>0;
function change(chart:ChartResult|undefined):number|null{
 if(!chart)return null;
 const closes=(chart.indicators?.quote?.[0]?.close||[]).filter(valid);
 const price=chart.meta?.regularMarketPrice??closes[closes.length-1];
 // chartPreviousClose is the close BEFORE the chart range (5 days here), not yesterday.
 const prev=chart.meta?.regularMarketPreviousClose??chart.meta?.previousClose??closes[closes.length-2];
 return valid(price)&&valid(prev)?(price/prev-1)*100:null;
}
async function chartQuote(symbol:string):Promise<number|null>{
 for(const host of ["query1.finance.yahoo.com","query2.finance.yahoo.com"]){
  try{
   const url="https://"+host+"/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=5d&interval=1d";
   const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"},next:{revalidate:300},signal:AbortSignal.timeout(4500)});
   if(!response.ok)continue;
   const json=await response.json();
   const value=change(json?.chart?.result?.[0]);
   if(value!==null)return value;
  }catch{}
 }
 return null;
}
export async function GET(req:NextRequest){
 const symbols=[...new Set((req.nextUrl.searchParams.get("symbols")||"").split(",").map(s=>s.trim().toUpperCase()).filter(s=>/^[A-Z0-9-]{1,12}$/.test(s)))].slice(0,80);
 const quotes:Record<string,number|null>={};
 for(const s of symbols)quotes[s]=null;
 if(!symbols.length)return NextResponse.json({quotes});
 // Fast bulk request first. The chart fallback below is independent of the ticker services.
 try{
  const url="https://query1.finance.yahoo.com/v7/finance/spark?"+new URLSearchParams({symbols:symbols.join(","),range:"5d",interval:"1d"});
  const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"},next:{revalidate:300},signal:AbortSignal.timeout(5000)});
  if(response.ok){
   const data=await response.json();
   for(const s of symbols){
    const item=data[s]||data[s.replace(/-/g,".")];
    quotes[s]=change(item?.response?.[0]||item?.chart?.result?.[0]);
   }
  }
 }catch{}
 // Yahoo's bulk spark endpoint is sometimes blocked. Fall back to individual
 // chart requests, with bounded concurrency so one large index doesn't overwhelm it.
 const remaining=symbols.filter(s=>quotes[s]===null);
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(10,remaining.length)},async()=>{
  while(cursor<remaining.length){
   const symbol=remaining[cursor++];
   quotes[symbol]=await chartQuote(symbol);
  }
 }));
 return NextResponse.json({quotes,available:Object.values(quotes).filter(v=>v!==null).length,total:symbols.length},{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}});
}
