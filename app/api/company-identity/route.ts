import {NextResponse} from "next/server";
import {lookupTicker} from "@/lib/sec";
export async function GET(req:Request){const ticker=new URL(req.url).searchParams.get("ticker")||"";if(!/^[A-Z0-9.^-]{1,12}$/i.test(ticker))return NextResponse.json({error:"Invalid ticker"},{status:400});const co=await lookupTicker(ticker);return NextResponse.json({name:co?.name??null,ticker:co?.ticker??ticker.toUpperCase()},{headers:{"Cache-Control":"public, max-age=3600"}})}
