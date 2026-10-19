import { notFound } from "next/navigation";
import { lookupTicker } from "@/lib/sec";
import { NAV } from "@/lib/nav";
import {getCompanyFacts} from "@/lib/sec";
import {buildStatement,STATEMENTS as DEFS} from "@/lib/statements";
import FinancialCharts from "@/components/FinancialCharts";
import TechnicalPriceChart from "@/components/TechnicalPriceChart";
import {getChart} from "@/lib/market";
import { STATEMENTS } from "@/lib/statements";
import StatementView from "@/components/StatementView";
import FilingsView from "@/components/FilingsView";

export default async function SubPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string; section: string; sub: string }>;
  searchParams: Promise<{ period?: string; range?: string }>;
}) {
  const [{ ticker, section: sectionId, sub }, query] = await Promise.all([params, searchParams]);
  const co = await lookupTicker(ticker);
  if (!co) notFound();
  const section = NAV.find((s) => s.id === sectionId);
  const item = section?.items.find((i) => i.id === sub);
  if (!section || !item) notFound();

  if(section.id==="charts"&&item.id==="price-chart"){const [chart,benchmark]=await Promise.all([getChart(co.ticker,"max"),getChart("^GSPC","max")]);return <TechnicalPriceChart ticker={co.ticker} points={chart?.points??[]} benchmark={benchmark?.points??[]}/>;}
  if (section.id === "financials" && STATEMENTS[item.id]) {
    const period = query.period === "annual" ? "annual" : "quarterly";
    return <StatementView cik={co.cik} ticker={co.ticker} sub={item.id} period={period} range={query.range ?? "all"} />;
  }
  if(section.id==="charts"&&item.id==="financial-chart"){try{const facts=await getCompanyFacts(co.cik);const data={quarterly:Object.fromEntries(Object.entries(DEFS).map(([key,def])=>[key,buildStatement(facts,def,"quarterly")])),annual:Object.fromEntries(Object.entries(DEFS).map(([key,def])=>[key,buildStatement(facts,def,"annual")]))};return <FinancialCharts ticker={co.ticker} data={data}/>;}catch{return <div className="panel">SEC financial data is temporarily unavailable.</div>}}
  if (section.id === "news" && item.id === "filings") return <FilingsView cik={co.cik} />;

  return (
    <div className="panel">
      <h2>{item.label}</h2>
      <p>This tab is not built yet. The navigation is in place so it can be filled in one tab at a time.</p>
    </div>
  );
}
