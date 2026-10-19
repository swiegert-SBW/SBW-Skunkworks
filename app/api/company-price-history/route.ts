import {NextResponse} from "next/server";
import {getChart} from "@/lib/market";
export async function GET(req:Request){const ticker=new URL(req.url).searchParams.get("ticker")?.toUpperCase()||"";if(!/^[A-Z0-9.^-]{1,12}$/.test(ticker))return NextResponse.json({error:"Invalid ticker"},{status:400});const chart=await getChart(ticker,"max");if(!chart)return NextResponse.json({error:"No price history available"},{status:404});return NextResponse.json({ticker,points:chart.points},{headers:{"Cache-Control":"public, max-age=300"}})}
