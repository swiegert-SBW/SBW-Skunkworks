import {getChart} from "@/lib/market";
import PerformanceChart from "@/components/PerformanceChart";
export default async function SnapshotMarket({ticker}:{ticker:string}){
 const [stock,spx]=await Promise.all([getChart(ticker,"max"),getChart("^GSPC","max")]);
 const stats:[string,string][]=[
 ["Ticker",ticker],["Price",stock?"$"+stock.price.toFixed(2):"N/A"],["Open",typeof stock?.open==="number"?"$"+stock.open.toFixed(2):"N/A"],
 ["Previous Close",stock?"$"+stock.prevClose.toFixed(2):"N/A"],
 ["52 Week Range",stock&&stock.low52!=null&&stock.high52!=null?"$"+stock.low52.toFixed(2)+" – $"+stock.high52.toFixed(2):"N/A"],
 ["Volume",stock?.volume?.toLocaleString("en-US")??"N/A"],
 ["First Trading Date",stock?.firstTradeDate?new Date(stock.firstTradeDate*1000).toLocaleDateString("en-US"):"N/A"],
 ["Ex-Dividend Date",stock?.exDividendDate?new Date(stock.exDividendDate*1000).toLocaleDateString("en-US"):"N/A"],
 ["Annual Dividend",typeof stock?.dividendRate==="number"?"$"+stock.dividendRate.toFixed(2):"N/A"],
 ["CUSIP","N/A"],["Enterprise Value","N/A"],["Float","N/A"],["Short Interest","N/A"],["WACC","N/A"],["Beta","N/A"]
 ];
 const series=(c:{points:{t:number;c:number}[]})=>({t:c.points.map(p=>p.t),c:c.points.map(p=>p.c)});
 return <><div className="panel"><h3>Performance</h3>{stock?<PerformanceChart stock={series(stock)} index={spx?series(spx):null} ticker={ticker}/>:<p className="muted">Price data temporarily unavailable.</p>}</div><div className="panel"><h3>Key Stats</h3><dl className="stats">{stats.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></>;
}
