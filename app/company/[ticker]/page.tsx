import { lookupTicker, getSubmissions } from "@/lib/sec";
import { getFundamentals } from "@/lib/data";
import { getChart } from "@/lib/market";
import { money } from "@/lib/format";
import PerformanceChart from "@/components/PerformanceChart";
import { notFound } from "next/navigation";

export default async function Snapshot({ params }: { params: { ticker: string } }) {
  const co = await lookupTicker(params.ticker);
  if (!co) notFound();
  const [subs, fund, stock, spx] = await Promise.all([
    getSubmissions(co.cik),
    getFundamentals(co.cik).catch(() => null),
    getChart(co.ticker),
    getChart("^GSPC"),
  ]);
  const a = subs.addresses?.business ?? {};
  const change = stock ? stock.price - stock.prevClose : 0;
  const changePct = stock ? (change / stock.prevClose) * 100 : 0;
  const mcap = stock && fund?.sharesOutstanding ? stock.price * fund.sharesOutstanding : null;
  const recent = subs.filings.recent;
  const k = recent.form.findIndex((f: string) => f === "10-K");

  const stats: [string, string][] = [
    ["Previous Close", stock ? `$${stock.prevClose.toFixed(2)}` : "n/a"],
    ["52 Week Range", stock ? `$${stock.low52?.toFixed(2)} - $${stock.high52?.toFixed(2)}` : "n/a"],
    ["Volume", stock ? stock.volume?.toLocaleString("en-US") : "n/a"],
    ["Shares Outstanding", fund?.sharesOutstanding ? fund.sharesOutstanding.toLocaleString("en-US") : "n/a"],
    ["Fiscal Year End", subs.fiscalYearEnd ? `${subs.fiscalYearEnd.slice(0, 2)}/${subs.fiscalYearEnd.slice(2)}` : "n/a"],
    ["CIK", co.cik],
  ];

  return (
    <div className="snapshot">
      <aside className="profile panel">
        <h3>Sector &amp; Industry</h3>
        <dl>
          <dt>Industry (SIC)</dt><dd>{subs.sicDescription || "n/a"}</dd>
        </dl>
        <h3>Business Description</h3>
        <p className="muted small">
          Coming next: this will be pulled from Item 1 of the latest 10-K.
          {k >= 0 && (
            <> <a href={`https://www.sec.gov/ix?doc=/Archives/edgar/data/${parseInt(co.cik, 10)}/${recent.accessionNumber[k].replace(/-/g, "")}/${recent.primaryDocument[k]}`} target="_blank" rel="noopener noreferrer">Read the latest 10-K</a>.</>
          )}
        </p>
        <h3>Corporate Information</h3>
        <dl>
          <dt>Headquarters</dt>
          <dd>{[a.street1, a.street2].filter(Boolean).join(", ")}<br />{[a.city, a.stateOrCountry, a.zipCode].filter(Boolean).join(", ")}</dd>
          <dt>Exchange</dt><dd>{subs.exchanges?.join(", ") || "n/a"}</dd>
          <dt>Phone</dt><dd>{subs.phone || "n/a"}</dd>
          <dt>Website</dt><dd>{subs.website ? <a href={subs.website.startsWith("http") ? subs.website : `https://${subs.website}`} target="_blank" rel="noopener noreferrer">Link</a> : "n/a"}</dd>
        </dl>
      </aside>

      <div className="main-col">
        <div className="panel headline">
          <div><span className="muted small">Price</span><div className="big">{stock ? `$${stock.price.toFixed(2)}` : "n/a"}
            {stock && <span className={change < 0 ? "neg small" : "pos small"}> {change.toFixed(2)} ({changePct.toFixed(2)}%)</span>}</div></div>
          <div><span className="muted small">Market Cap</span><div className="big">{mcap ? money(mcap) : "n/a"}</div></div>
          <div><span className="muted small">Annual Revenue</span><div className="big">{fund?.revenue ? money(fund.revenue.value) : "n/a"}</div></div>
        </div>
        <div className="panel">
          <h3>Performance</h3>
          {stock ? <PerformanceChart stock={stock} index={spx} ticker={co.ticker} /> : <p className="muted">Price data is unavailable right now.</p>}
        </div>
        <div className="panel">
          <h3>Key Stats</h3>
          <dl className="stats">
            {stats.map(([l, v]) => (<div key={l}><dt>{l}</dt><dd>{v}</dd></div>))}
          </dl>
        </div>
      </div>
    </div>
  );
}
