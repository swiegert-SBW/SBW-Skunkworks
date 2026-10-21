import {cache} from "react";
type Kind="13f"|"form4"|"estimates"|"dividends"|"segments"|"peers"|"events"|"screener";
const allowed:Record<Kind,string[]>={ "13f":["topholders","summary"],form4:["alltransactions","topholders"],estimates:["historic","latest","eps"],dividends:["dps","divyield"],segments:["revenue"],peers:["default"],events:["corporate"],screener:["fundamentals"]};
export const businessQuant=cache(async(kind:Kind,ticker:string,mode:string)=>{
 const key=process.env.BUSINESSQUANT_API_KEY;
 if(!key)return {data:null,error:"Business Quant API key is not configured"};
 if(!allowed[kind]?.includes(mode))return {data:null,error:"Unsupported data request"};
 const endpoint=kind==="events"?"corporate_actions":kind==="screener"?"screener":kind;
 const url=new URL("https://data.businessquant.com/"+endpoint);
 if(kind!=="screener")url.searchParams.set(kind==="13f"?"ticker_issuer":"ticker",ticker);
 if(kind==="segments"){url.searchParams.set("series","Revenue");url.searchParams.set("mode",mode)}
 else if(kind==="events"){url.searchParams.set("period","1y");url.searchParams.set("limit","100")}
 else if(kind!=="peers"&&kind!=="screener")url.searchParams.set("mode",mode);
 url.searchParams.set("api_key",key);
 try{
  const response=await fetch(url,{next:{revalidate:86400},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return {data:null,error:"Business Quant returned HTTP "+response.status};
  const body=await response.json();
  return {data:body?.data??null,error:null};
 }catch{return {data:null,error:"Business Quant request unavailable"}}
});
