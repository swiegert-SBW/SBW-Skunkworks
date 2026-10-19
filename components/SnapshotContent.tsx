import { lookupTicker, getSubmissions } from "@/lib/sec";
import BusinessDescription from "@/components/BusinessDescription";
import { Suspense } from "react";
import SnapshotFundamentals from "@/components/SnapshotFundamentals";
import { getChart } from "@/lib/market";
import { money } from "@/lib/format";
import PerformanceChart from "@/components/PerformanceChart";
import { notFound } from "next/navigation";
import type { Chart } from "@/lib/market";

const toSeries = (c: Chart) => ({ t: c.points.map((p) => p.t), c: c.points.map((p) => p.c) });

export default async function SnapshotContent({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const co = await lookupTicker(ticker);
  if (!co) notFound();
  const [subs, stock, spx] = await Promise.all([
    getSubmissions(co.cik),
    getChart(co.ticker, "1y"),
    getChart("^GSPC", "1y"),
  ]);
  const a = subs.addresses?.business ?? {};
  const change = stock ? stock.price - stock.prevClose : 0;
  const changePct = stock ? (change / stock.prevClose) * 100 : 0;

  // Do not block the security snapshot on third-party WACC pages or a second SEC facts pass.
  const extra={enterpriseValue:null as number|null},wacc=null as {value:number;source:string}|null;
  const recent = subs.filings.recent;
  const k = recent.form.findIndex((f: string) => f === "10-K");
  const description = null; // Fetching and parsing an entire 10-K blocked the page on every cold load.

  const stats: [string, string][] = [
    ["Ticker", co.ticker],
    ["Price", stock ? `${stock.price.toFixed(2)}` : "n/a"],

    ["Open", typeof stock?.open==="number"?stock.open.toFixed(2):"N/A"],
    ["Previous Close", stock ? `${stock.prevClose.toFixed(2)}` : "n/a"],
    ["52 Week Range", stock ? `$${stock.low52?.toFixed(2)} - $${stock.high52?.toFixed(2)}` : "n/a"],
    ["Volume", stock ? stock.volume?.toLocaleString("en-US") : "n/a"],

    ["Enterprise Value",extra.enterpriseValue!==null?money(extra.enterpriseValue):"N/A"],

    ["Float", "N/A"],
    ["Short Interest", "N/A"],
    ["WACC",wacc?`${wacc.value.toFixed(2)}% (${wacc.source})`:"N/A"],
    ["Beta", "N/A"],
    ["CUSIP", "N/A"],
    ["First Trading Date",stock?.firstTradeDate?new Date(stock.firstTradeDate*1000).toLocaleDateString("en-US"):"N/A"],
    ["Ex-Dividend Date",stock?.exDividendDate?new Date(stock.exDividendDate*1000).toLocaleDateString("en-US"):"N/A"],
    ["Annual Dividend",typeof stock?.dividendRate==="number"?"$"+stock.dividendRate.toFixed(2):"N/A"],
    ["Fiscal Year End", subs.fiscalYearEnd ? `${subs.fiscalYearEnd.slice(0, 2)}/${subs.fiscalYearEnd.slice(2)}` : "n/a"],
  ];

  return (
    <div className="snapshot">
      <aside className="profile panel">
        <h3>Corporate Information</h3>
        <dl>
          <dt>Company Name</dt><dd>{co.name}</dd>
          <dt>Headquarters</dt>
          <dd>{[a.street1, a.street2].filter(Boolean).join(", ")}<br />{[a.city, a.stateOrCountry, a.zipCode].filter(Boolean).join(", ")}</dd>
          <dt>Exchange</dt><dd>{subs.exchanges?.join(", ") || "n/a"}</dd>
          <dt>Phone</dt><dd>{subs.phone || "n/a"}</dd>
          <dt>Website</dt><dd>{subs.website ? <a href={subs.website.startsWith("http") ? subs.website : `https://${subs.website}`} target="_blank" rel="noopener noreferrer">Link</a> : "n/a"}</dd>
        </dl>
        <div className="profile-subsection">
          <h4>Business Description</h4>
          <BusinessDescription description={description} filingUrl={k >= 0 ? `https://www.sec.gov/ix?doc=/Archives/edgar/data/${parseInt(co.cik, 10)}/${recent.accessionNumber[k].replace(/-/g, "")}/${recent.primaryDocument[k]}` : undefined} />
        </div>
        <div className="profile-subsection">
          <h4>Sector &amp; Industry</h4>
          <dl><dt>Industry (SIC)</dt><dd>{subs.sicDescription || "n/a"}</dd></dl>
        </div>
      </aside>

      <div className="main-col">
        <div className="panel">
          <h3>Performance</h3>
          {stock ? <PerformanceChart stock={toSeries(stock)} index={spx ? toSeries(spx) : null} ticker={co.ticker} /> : <p className="muted">Price data is unavailable right now.</p>}
          {stock && <p className={change < 0 ? "neg small" : "pos small"}>Latest change: {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)</p>}
        </div>
        <div className="panel">
          <h3>Key Stats</h3>
          <dl className="stats">
            {stats.map(([l, v]) => (<div key={l}><dt>{l}</dt><dd>{v}</dd></div>))}
          </dl>
          <Suspense fallback={<p className="muted small">Loading SEC fundamentals…</p>}><SnapshotFundamentals cik={co.cik} price={stock?.price??null}/></Suspense>
        </div>
      </div>
    </div>
  );
}
