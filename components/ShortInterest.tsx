import {getChart} from "@/lib/market";
import ShortInterestChart from "@/components/ShortInterestChart";
import {getArchivedShortInterest} from "@/lib/short-interest-archive";
type Point={date:string;shares:number;days:number|null;percent:number|null};
async function loadShort(ticker:string):Promise<Point[]>{
 try{
  const r=await fetch("https://api.nasdaq.com/api/quote/"+encodeURIComponent(ticker.toUpperCase())+"/short-interest?assetclass=stocks",{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json","Origin":"https://www.nasdaq.com"},next:{revalidate:86400},signal:AbortSignal.timeout(7000)});
  if(!r.ok)return [];const j=await r.json();const rows=j?.data?.shortInterestTable?.rows??j?.data?.rows??[];
  if(!Array.isArray(rows))return [];
  const n=(v:any)=>{if(v===null||v===undefined||String(v).trim()==="")return null;const x=Number(String(v).replace(/[^0-9.\-]/g,""));return Number.isFinite(x)?x:null};
  return rows.map((r:any)=>({date:String(r.settlementDate??r.date??""),shares:n(r.interest??r.shortInterest??r.shortInterestShares),days:n(r.daysToCover??r.avgDailyShareVolumeRatio),percent:n(r.percentOfFloat??r.shortPercentFloat)})).filter((x:{date:string;shares:number|null;days:number|null;percent:number|null}):x is Point=>Boolean(x.date)&&x.shares!==null).reverse();
 }catch{return []}
}
export default async function ShortInterest({ticker}:{ticker:string}){
 const [live,saved,chart]=await Promise.all([loadShort(ticker),getArchivedShortInterest(ticker),getChart(ticker,"3mo")]);
 const normalized=(p:Point)=>{const d=new Date(p.date);return {...p,date:Number.isFinite(d.getTime())?d.toISOString().slice(0,10):p.date}};
 const historyRaw=Array.from(new Map([...saved,...live].map(p=>{const point=normalized(p);return [point.date,point]})).values()).sort((a,b)=>a.date.localeCompare(b.date));
 const history=historyRaw.map(p=>({...p,percent:p.percent??(chart?.floatShares&&chart.floatShares>0?p.shares/chart.floatShares*100:null)}));
 const last=history.at(-1),prev=history.at(-2);
 const change=last&&prev&&prev.shares?((last.shares/prev.shares)-1)*100:null;
 const fields:[string,string][]=[
 ["Current Short Interest",last?last.shares.toLocaleString()+" shares":"N/A"],
 ["Previous Short Interest",prev?prev.shares.toLocaleString()+" shares":"N/A"],
 ["Change vs. Previous Report",change!==null?change.toFixed(2)+"%":"N/A"],
 ["Dollar Value Sold Short",last&&chart?"$"+(last.shares*chart.price/1e9).toFixed(2)+" billion":"N/A"],
 ["Days to Cover",last?.days!=null?last.days.toFixed(2):"N/A"],
 ["Last Record Date",last?.date??"N/A"],
 ["Outstanding Shares",chart?.sharesOutstanding!=null?chart.sharesOutstanding.toLocaleString()+" shares":"N/A"],
 ["Short Percent of Float",last?.percent!=null?last.percent.toFixed(2)+"%":"N/A"],
 ["Today's Trading Volume",chart?.volume!=null?chart.volume.toLocaleString()+" shares":"N/A"],
 ["Average Trading Volume",chart?.averageVolume!=null?chart.averageVolume.toLocaleString()+" shares":"N/A"],
 ["Today's Volume vs. Average",chart?.averageVolume&&chart.volume!=null?(100*chart.volume/chart.averageVolume).toFixed(0)+"%":"N/A"]];
 return <div style={{display:"grid",gap:16}}>
 <div className="panel"><h2 style={{margin:"0 0 6px"}}>Short Interest · {ticker}</h2><p className="muted small">Exchange-reported short interest, not daily short-sale volume. Reporting generally occurs twice monthly; data may be delayed.</p></div>
 <div className="panel" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"8px 28px"}}>{fields.map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",gap:16,padding:"9px 0",borderBottom:"1px solid var(--border,#263547)",fontSize:13}}><span className="muted">{k}</span><strong style={{textAlign:"right"}}>{v}</strong></div>)}</div>
 <ShortInterestChart history={history} price={chart?.price??null}/>
 <div className="panel"><p className="muted small">Source: Nasdaq public short-interest endpoint when accessible. Short percent of float is calculated when float shares are available. Short interest represents shares outstanding short at a reporting date; dollar value is an approximation using the latest available share price. Data availability varies by security.</p></div>
 </div>;
}
