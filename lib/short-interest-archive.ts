import "server-only";
type Point={date:string;shares:number;days:number|null;percent:number|null};
export async function getArchivedShortInterest(ticker:string):Promise<Point[]>{
 if(!/^[A-Z0-9.^-]{1,12}$/.test(ticker))return [];
 try{
  const url="https://raw.githubusercontent.com/swiegert-SBW/SBW-Skunkworks/main/data/short-interest/"+encodeURIComponent(ticker)+".json";
  const res=await fetch(url,{next:{revalidate:86400},signal:AbortSignal.timeout(4000)});
  if(!res.ok)return [];
  const body=await res.json();
  if(!Array.isArray(body.observations))return [];
  return body.observations.filter((p:Point)=>typeof p.date==="string"&&typeof p.shares==="number");
 }catch{return []}
}
