import {NextRequest,NextResponse} from "next/server";
import {businessQuant} from "@/lib/businessquant";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const p=req.nextUrl.searchParams,kind=p.get("kind")||"",ticker=(p.get("ticker")||"").toUpperCase(),mode=p.get("mode")||"";
 const modes:Record<string,string[]>={estimates:["revenue","eps"],dividends:["dps","divyield"],segments:["historic","latest"],peers:["default"],events:["corporate"],screener:["fundamentals"]};
 if(!modes[kind]?.includes(mode)||(kind!=="screener"&&!/^[A-Z0-9.^-]{1,15}$/.test(ticker)))return NextResponse.json({error:"Invalid request"},{status:400});
 const result=await businessQuant(kind as "estimates"|"dividends"|"segments"|"peers"|"events"|"screener",ticker,mode);
 return NextResponse.json({...result,source:"Business Quant",updatedAt:new Date().toISOString()},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=604800"}});
}
