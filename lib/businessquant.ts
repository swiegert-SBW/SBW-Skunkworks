import {cache} from "react";
type Kind="13f"|"form4"|"estimates"|"dividends"|"segments"|"peers"|"events"|"screener";
const allowed:Record<Kind,string[]>={ "13f":["topholders","summary"],form4:["alltransactions","topholders"],estimates:["consensus"],dividends:["history"],segments:["revenue"],peers:["overview"],events:["recent"],screener:["fundamentals"]};
export const businessQuant=cache(async(kind:Kind,ticker:string,mode:string)=>{
 const key=process.env.BUSINESSQUANT_API_KEY;
 if(!key)return {data:null,error:"Business Quant API key is not configured"};
 if(!allowed[kind]?.includes(mode))return {data:null,error:"Unsupported data request"};
 const url=new URL("https://data.businessquant.com/"+kind);
 if(kind!=="screener")url.searchParams.set(kind==="13f"?"ticker_issuer":"ticker",ticker);
 url.searchParams.set("mode",mode);
 url.searchParams.set("api_key",key);
 try{
  const response=await fetch(url,{next:{revalidate:86400},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return {data:null,error:"Business Quant returned HTTP "+response.status};
  const body=await response.json();
  return {data:body?.data??null,error:null};
 }catch{return {data:null,error:"Business Quant request unavailable"}}
});
