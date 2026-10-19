import {getCompanyFacts,lookupTicker} from "@/lib/sec";
import {buildStatement,STATEMENTS} from "@/lib/statements";
import FinancialCharts from "@/components/FinancialCharts";
export default async function FinancialChartsData({ticker}:{ticker:string}){
 const co=await lookupTicker(ticker);
 if(!co)return <div className="panel">Company not found.</div>;
 try{
  const facts=await getCompanyFacts(co.cik);
  const data={
   quarterly:Object.fromEntries(Object.entries(STATEMENTS).map(([key,def])=>[key,buildStatement(facts,def,"quarterly")])),
   annual:Object.fromEntries(Object.entries(STATEMENTS).map(([key,def])=>[key,buildStatement(facts,def,"annual")]))
  };
  return <FinancialCharts ticker={co.ticker} data={data}/>;
 }catch{return <div className="panel">SEC financial data is temporarily unavailable.</div>}
}
