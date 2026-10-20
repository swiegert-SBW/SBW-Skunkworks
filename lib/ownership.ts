import {cache} from "react";
const key=process.env.BUSINESSQUANT_API_KEY||"";
export const getOwnership=cache(async(ticker:string,kind:"13f"|"form4",mode:string)=>{
 if(!key)return null;
 const u=new URL("https://data.businessquant.com/"+kind);
 u.searchParams.set(kind==="13f"?"ticker_issuer":"ticker",ticker.toUpperCase());
 u.searchParams.set("mode",mode);u.searchParams.set("api_key",key);
 if(kind==="form4"&&mode==="alltransactions"){u.searchParams.set("period","1y");u.searchParams.set("page_size","100")}
 try{const r=await fetch(u.toString(),{next:{revalidate:86400},signal:AbortSignal.timeout(8000)});if(!r.ok)return null;const j=await r.json();return j?.data??null}catch{return null}
});
export const numberValue=(o:any,...keys:string[]):number|null=>{for(const k of keys){const v=o?.[k];if(v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v)))return Number(v)}return null};
export const stringValue=(o:any,...keys:string[]):string=>{for(const k of keys){const v=o?.[k];if(v!==null&&v!==undefined&&String(v).trim())return String(v)}return "N/A"};
