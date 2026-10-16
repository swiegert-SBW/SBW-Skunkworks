import {NextRequest,NextResponse} from "next/server";
import sp from "@/data/indices/sp500.json";
import russell from "@/data/indices/russell2000.json";
export const runtime="nodejs";
const snapshots:Record<string,typeof sp>={sp500:sp,russell2000:russell};
export async function GET(req:NextRequest){
 const index=req.nextUrl.searchParams.get("index")||"sp500";
 if(!snapshots[index])return NextResponse.json({error:"Unknown index"},{status:400});
 const snapshot=snapshots[index];
 return NextResponse.json(snapshot,{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=3600"}});
}
