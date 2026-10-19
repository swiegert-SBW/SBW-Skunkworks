import {NextResponse} from "next/server";
export const runtime="nodejs";
type Item={period:string;sno:number;data_type:"reported"|"estimate";value_estimate:number|null;value_reported:number|null;high_estimate:number|null;low_estimate:number|null};
type Block={dimension:string;estimates:Item[]};
type Result={data:Block[]};
export async function GET(req:Request){
 const ticker=(new URL(req.url).searchParams.get("ticker")||"").toUpperCase();
 if(!/^[A-Z0-9.^-]{1,15}$/.test(ticker))return NextResponse.json({error:"Invalid ticker"},{status:400});
 const key=process.env.BUSINESSQUANT_API_KEY;
 const source="https://businessquant.com/docs/api/estimates";
 if(!key)return NextResponse.json({ticker,annual:[],quarterly:[],source,sourceName:"Business Quant",notice:"Consensus feed requires a free Business Quant API key. Set BUSINESSQUANT_API_KEY in Render environment settings."},{headers:{"Cache-Control":"no-store"}});
 try{
  const results=await Promise.all((["revenue","eps"] as const).map(async mode=>{
   const url=new URL("https://data.businessquant.com/estimates");
   url.searchParams.set("ticker",ticker);url.searchParams.set("mode",mode);url.searchParams.set("api_key",key);
   const response=await fetch(url.toString(),{next:{revalidate:3600},signal:AbortSignal.timeout(9000)});
   if(!response.ok)throw Error("Business Quant returned HTTP "+response.status);
   const json=await response.json() as Result;
   if(!Array.isArray(json.data))throw Error("Invalid estimates response");
   return {mode,data:json.data};
  }));
  const build=(dimension:"annual"|"quarter")=>{
   const grouped=new Map<string,{period:string;order:number;type:"reported"|"estimate";revenue:Item|null;eps:Item|null}>();
   for(const result of results){const section=result.data.find(b=>b.dimension===dimension);for(const item of section?.estimates||[]){
    if(!item.period)continue;
    const existing=grouped.get(item.period)||{period:item.period,order:item.sno,type:item.data_type,revenue:null,eps:null};
    existing[result.mode]=item;grouped.set(item.period,existing);
   }}
   return [...grouped.values()].sort((a,b)=>a.order-b.order).filter(row=>row.revenue||row.eps);
  };
  return NextResponse.json({ticker,annual:build("annual"),quarterly:build("quarter"),source,sourceName:"Business Quant",notice:"Consensus and reported values from Business Quant. Analyst counts and standard deviations are not provided by this feed."},{headers:{"Cache-Control":"public, s-maxage=3600"}});
 }catch(e){return NextResponse.json({ticker,annual:[],quarterly:[],source,sourceName:"Business Quant",notice:"Estimates are unavailable from Business Quant right now.",error:e instanceof Error?e.message:"Unavailable"},{headers:{"Cache-Control":"no-store"}})}
}
