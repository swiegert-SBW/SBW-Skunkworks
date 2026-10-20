import {NextRequest,NextResponse} from "next/server";
import {getChart} from "@/lib/market";
import universe from "@/data/watchlist-universe.json";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const tickers=Array.from(new Set((req.nextUrl.searchParams.get("tickers")||"").split(",").map(t=>t.trim().toUpperCase()).filter(t=>/^[A-Z0-9.^-]{1,12}$/.test(t)))).slice(0,120);
 const ranges=["1mo","3mo","6mo","1y","3y","5y"];
 const range=ranges.includes(req.nextUrl.searchParams.get("range")||"")?req.nextUrl.searchParams.get("range")!:"1y";
 const aliases=universe.aliases as Record<string,{quote?:string}>;
 const series=await Promise.all(tickers.map(async ticker=>{
  const chart=await getChart(aliases[ticker]?.quote??ticker,range,"1d");
  return {ticker,points:chart?.points??[]};
 }));
 return NextResponse.json({series,range},{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=1800"}});
}
