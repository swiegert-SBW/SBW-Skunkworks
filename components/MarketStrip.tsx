import { getChart } from "@/lib/market";
import WatchlistTickerMarquee from "@/components/WatchlistTickerMarquee";

const ITEMS = [
  { label: "S&P 500", sym: "^GSPC" },
  { label: "Nasdaq", sym: "^IXIC" },
  { label: "DJIA", sym: "^DJI" },
  { label: "Russell 2000", sym: "^RUT" },
  { label: "NIKKEI", sym: "^N225" },
  { label: "STOXX 600", sym: "^STOXX" },
  { label: "US 10Y Note", sym: "^TNX" },
  { label: "WTI Oil", sym: "CL=F" },
  { label: "Gold", sym: "GC=F" },
  { label: "EUR/USD", sym: "EURUSD=X" },
  { label: "BTC", sym: "BTC-USD" },
];

export default async function MarketStrip() {
  const data = await Promise.all(ITEMS.map((i) => getChart(i.sym, "5d").catch(() => null)));
  const f = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  return (
    <div className="strip" aria-label="Market overview and watchlist ticker">
      <div className="strip-quote-row" aria-label="Major market quotes">
        {ITEMS.map((it, i) => {
          const d = data[i];
          const chg = d ? d.price - d.prevClose : 0;
          const pct = d?.prevClose ? (chg / d.prevClose) * 100 : 0;
          return (
            <div className="tick" key={it.sym} title={it.label}>
              <span className="tick-label">{it.label}</span>
              <span className="tick-val">{d ? f(d.price) : "—"}</span>
              {d && <span className={`tick-chg ${chg < 0 ? "neg" : "pos"}`}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</span>}
            </div>
          );
        })}
      </div>
      <div className="strip-ticker-row" aria-label="Scrolling watchlist quotes"><WatchlistTickerMarquee /></div>
    </div>
  );
}
