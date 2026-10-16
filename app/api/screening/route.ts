import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
const HOST="https://api.massive.com";
const METRICS=["market_cap","price_to_earnings","price_to_book","price_to_sales","price_to_cash_flow","price_to_free_cash_flow","ev_to_ebitda","ev_to_sales","dividend_yield","return_on_assets","return_on_equity","debt_to_equity","current","quick","average_volume","price","free_cash_flow","earnings_per_share"] as const;
const LIMIT=500;
export async function GET(req:NextRequest){
 const key=process.env.MASSIVE_API_KEY||process.env.POLYGON_API_KEY;
 if(!key)return NextResponse.json({error:"MASSIVE_API_KEY is not configured in the Vercel project's environment variables.",code:"missing_key"},{status:503});
 const p=req.nextUrl.searchParams,mode=p.get("mode")==="reference"?"reference":"ratios";
 const params=new URLSearchParams({apiKey:key,limit:String(LIMIT)});
 const ticker=(p.get("ticker")||"").toUpperCase().trim();
 if(ticker&&!/^[A-Z0-9.\-]{1,12}$/.test(ticker))return NextResponse.json({error:"Invalid ticker"},{status:400});
 let endpoint="";
 if(mode==="ratios"){
  endpoint="/stocks/financials/v1/ratios";params.set("sort","ticker.asc");
  if(ticker)params.set("ticker",ticker);
  for(const field of METRICS){
   for(const op of ["gte","lte","gt","lt"]){
    const v=p.get(field+"."+op);
    if(v!==null&&v!==""&&Number.isFinite(Number(v)))params.set(field+"."+op,v);
   }
  }
 }else{
  endpoint="/v3/reference/tickers";params.set("market","stocks");params.set("active","true");params.set("sort","ticker");params.set("order","asc");
  if(ticker)params.set("ticker",ticker);
  if(p.get("exchange"))params.set("exchange",p.get("exchange")!);
 }
 const cursor=p.get("cursor");
 if(cursor){if(cursor.length>2048)return NextResponse.json({error:"Invalid page cursor"},{status:400});params.set("cursor",cursor)}
 try{
  const res=await fetch(HOST+endpoint+"?"+params,{headers:{"Accept":"application/json"},next:{revalidate:900},signal:AbortSignal.timeout(16000)});
  const json=await res.json().catch(()=>({}));
  if(!res.ok)return NextResponse.json({error:res.status===403?"Massive denied access to this endpoint. Financials & Ratios may not be included in your plan.":res.status===429?"Massive API rate limit reached. Try again shortly.":String(json.error||json.message||"Massive API request failed"),code:res.status===403?"access_denied":"upstream_error",status:res.status},{status:res.status===429?429:502});
  const next=String(json.next_url||"");
  const nextCursor=next?new URL(next).searchParams.get("cursor"):null;
  const results=Array.isArray(json.results)?json.results:[];
  return NextResponse.json({mode,results,nextCursor,count:results.length,asOf:results[0]?.date||null,provider:"Massive",planNotice:mode==="ratios"?"Financials & Ratios access required":null},{headers:{"Cache-Control":"private, max-age=0"}});
 }catch{return NextResponse.json({error:"Could not reach Massive. Please try again."},{status:502})}
}
