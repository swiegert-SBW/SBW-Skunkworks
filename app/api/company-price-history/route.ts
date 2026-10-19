import {NextResponse} from "next/server";
import {getChart} from "@/lib/market";
const settings:Record<string,[string,string]>={"1D":["1d","5m"],"5D":["5d","30m"],"1M":["1mo","1d"],"3M":["3mo","1d"],"6M":["6mo","1d"],"YTD":["ytd","1d"],"1Y":["1y","1d"],"3Y":["3y","1d"],"5Y":["5y","1d"],"ALL":["max","1d"]};
export async function GET(req:Request){
 const params=new URL(req.url).searchParams,ticker=(params.get("ticker")||"").toUpperCase(),range=params.get("range")||"1Y";
 if(!/^[A-Z0-9.^-]{1,12}$/.test(ticker)||!settings[range])return NextResponse.json({error:"Invalid query"},{status:400});
 const [span,interval]=settings[range],chart=await getChart(ticker,span,interval);
 if(!chart)return NextResponse.json({error:"No price history available"},{status:404});
 return NextResponse.json({ticker,points:chart.points},{headers:{"Cache-Control":"public, max-age=300"}});
}
