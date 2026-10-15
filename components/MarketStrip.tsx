import { getChart } from "@/lib/market";
import WatchlistTickerMarquee from "@/components/WatchlistTickerMarquee";

const ITEMS = [
  { label: "S&P 500", sym: "^GSPC" }, { label: "Nasdaq Composite", sym: "^IXIC" }, { label: "DJ 30 Industrial Avg", sym: "^DJI" },
  { label: "Gold", sym: "GC=F" }, { label: "Crude Oil WTI", sym: "CL=F" }, { label: "US 10Y Note", sym: "^TNX" }, { label: "USD/JPY", sym: "JPY=X" },
];

export default async function MarketStrip() {
  const data = await Promise.all(ITEMS.map((i) => getChart(i.sym, "5d")));
  if (data.every((d) => !d)) return null;
  const f = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="strip" aria-label="Market overview">
      {ITEMS.map((it, i) => {
        const d = data[i];
        if (!d) return null;
        const chg = d.price - d.prevClose;
        const pct = d.prevClose ? (chg / d.prevClose) * 100 : 0;
        const c = chg < 0 ? "neg" : "pos";
        return (
          <div className="tick" key={it.sym}>
            <div className="tick-label">{it.label}</div>
            <div className="tick-row">
              <span className="tick-val">{f(d.price)}</span>
              <span className={`tick-chg ${c}`}>
                <span>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}</span>
                <span>({pct >= 0 ? "+" : ""}{pct.toFixed(2)}%)</span>
              </span>
            </div>
          </div>
        );
      })}
      <WatchlistTickerMarquee />
    </div>
  );
}
