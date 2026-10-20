import directory from "@/data/ticker-company-names.json";
import universe from "@/data/watchlist-universe.json";
import {NextResponse} from "next/server";
export async function GET(req:Request){
 const query=(new URL(req.url).searchParams.get("q")||"").trim().toUpperCase();
 if(query.length<1)return NextResponse.json({results:[]});
 const names=directory as Record<string,string>;
 const aliases=universe.aliases as Record<string,{name?:string}>;
 const entries=new Map<string,string>(Object.entries(names));
 for(const [ticker,item] of Object.entries(aliases))if(item.name)entries.set(ticker,item.name);
 const scored:Array<{ticker:string;name:string;score:number}>=[];
 for(const [ticker,name] of entries){
  const n=name.toUpperCase();
  const score=ticker===query?0:ticker.startsWith(query)?1:n.startsWith(query)?2:n.includes(query)?3:99;
  if(score<99)scored.push({ticker,name,score});
 }
 scored.sort((a,b)=>a.score-b.score||a.ticker.localeCompare(b.ticker));
 return NextResponse.json({results:scored.slice(0,12).map(({ticker,name})=>({ticker,name}))},{headers:{"Cache-Control":"public, max-age=300"}});
}
