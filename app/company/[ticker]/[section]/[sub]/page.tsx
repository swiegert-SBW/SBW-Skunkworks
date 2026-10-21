import {Suspense} from "react";
import {notFound} from "next/navigation";
import {lookupTicker} from "@/lib/sec";
import {NAV} from "@/lib/nav";
import FinancialChartsData from "@/components/FinancialChartsData";
import TechnicalPriceChart from "@/components/TechnicalPriceChart";
import {STATEMENTS} from "@/lib/statements";
import StatementView from "@/components/StatementView";
import FilingsView from "@/components/FilingsView";
import CompanyNews from "@/components/CompanyNews";
import ConsensusEstimates from "@/components/ConsensusEstimates";
import OwnershipOverview from "@/components/OwnershipOverview";
import ShortInterest from "@/components/ShortInterest";
import BusinessQuantPanel from "@/components/BusinessQuantPanel";
export default async function SubPage({params,searchParams}:{params:Promise<{ticker:string;section:string;sub:string}>;searchParams:Promise<{period?:string;range?:string}>}){
 const [{ticker,section:sectionId,sub},query]=await Promise.all([params,searchParams]);
 const section=NAV.find(s=>s.id===sectionId),item=section?.items.find(i=>i.id===sub);
 if(!section||!item)notFound();
 const symbol=ticker.toUpperCase();
 if(section.id==="financials"&&item.id==="dividends")return <BusinessQuantPanel ticker={symbol} kind="dividends"/>;
 if(section.id==="financials"&&item.id==="segments")return <BusinessQuantPanel ticker={symbol} kind="segments"/>;
 if(section.id==="overviews"&&item.id==="comps")return <BusinessQuantPanel ticker={symbol} kind="peers"/>;
 if(section.id==="news"&&item.id==="events")return <BusinessQuantPanel ticker={symbol} kind="events"/>;
 if(section.id==="ownership"&&item.id==="short-interest")return <ShortInterest ticker={symbol}/>;
 if(section.id==="ownership")return <OwnershipOverview ticker={symbol}/>;
 if(section.id==="estimates"&&item.id==="consensus")return <ConsensusEstimates ticker={symbol}/>;
 if(section.id==="charts"&&item.id==="price-chart")return <TechnicalPriceChart key={symbol} ticker={symbol}/>;
 if(section.id==="charts"&&item.id==="financial-chart")return <Suspense fallback={<div className="panel">Loading SEC financial data…</div>}><FinancialChartsData ticker={symbol}/></Suspense>;
 if(section.id==="financials"&&STATEMENTS[item.id])return <Suspense fallback={<div className="panel">Loading financial statement…</div>}><StatementData ticker={symbol} sub={item.id} period={query.period==="annual"?"annual":"quarterly"} range={query.range??"all"}/></Suspense>;
 if(section.id==="news"&&item.id==="news")return <CompanyNews key={symbol} ticker={symbol}/>;
 if(section.id==="news"&&item.id==="filings")return <Suspense fallback={<div className="panel">Loading SEC filings…</div>}><FilingsData ticker={symbol}/></Suspense>;
 return <div className="panel"><h2>{item.label}</h2><p>This tab is not built yet.</p></div>;
}
async function StatementData({ticker,sub,period,range}:{ticker:string;sub:string;period:"quarterly"|"annual";range:string}){
 const co=await lookupTicker(ticker);if(!co)notFound();return <StatementView cik={co.cik} ticker={ticker} sub={sub} period={period} range={range}/>;
}
async function FilingsData({ticker}:{ticker:string}){
 const co=await lookupTicker(ticker);if(!co)notFound();return <FilingsView cik={co.cik}/>;
}
