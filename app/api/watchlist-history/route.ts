import {NextRequest,NextResponse} from "next/server";
import {getChart} from "@/lib/market";
import universe from "@/data/watchlist-universe.json";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const tickers=Array.from(new Set((req.nextUrl.searchParams.get("tickers")||"").split(",").map(t=>t.trim().toUpperCase()).filter(t=>/^[A-Z0-9.^-]{1,12}$/.test(t)))).slice(0,120);
 const ranges=["1mo","3mo","6mo","1y","3y","5y","10y","15y"];
 const range=ranges.includes(req.nextUrl.searchParams.get("range")||"")?req.nextUrl.searchParams.get("range")!:"1y";
 const aliases=universe.aliases as Record<string,{quote?:string}>;
 const interval=["5y","10y","15y"].includes(range)?"1wk":"1d";
 const providerRange=range==="15y"?"max":range==="3y"?"5y":range;
 const cutoff=Date.now()/1000-({ "3y":3,"15y":15 } as Record<string,number>)[range]*365.25*86400;
 const series=await Promise.all(tickers.map(async ticker=>{
  const chart=await getChart(aliases[ticker]?.quote??ticker,providerRange,interval);
  return {ticker,points:chart?.points?.filter(p=>!(range==="3y"||range==="15y")||p.t>=cutoff)??[]};
 }));
 return NextResponse.json({series,range},{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=1800"}});
}
