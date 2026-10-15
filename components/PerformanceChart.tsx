// Draws the 1-year performance of the stock vs the S&P 500 as % change. Plain SVG, no chart library.
import type { Chart } from "@/lib/market";

const W = 640, Ht = 220, PAD = 8;

function pct(points: { t: number; c: number }[]) {
  const base = points[0].c;
  return points.map((p) => ({ t: p.t, v: (p.c / base - 1) * 100 }));
}

export default function PerformanceChart({ stock, index, ticker }: { stock: Chart; index: Chart | null; ticker: string }) {
  const a = pct(stock.points);
  const b = index && index.points.length > 1 ? pct(index.points) : null;
  const all = [...a, ...(b ?? [])];
  const t0 = Math.min(...all.map((p) => p.t)), t1 = Math.max(...all.map((p) => p.t));
  const v0 = Math.min(...all.map((p) => p.v)), v1 = Math.max(...all.map((p) => p.v));
  const x = (t: number) => PAD + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * PAD);
  const y = (v: number) => Ht - PAD - ((v - v0) / (v1 - v0 || 1)) * (Ht - 2 * PAD);
  const path = (s: { t: number; v: number }[]) => s.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const zero = y(0);
  return (
    <div>
      <div className="legend">
        <span><i style={{ background: "var(--blue)" }} />{ticker}</span>
        {b && <span><i style={{ background: "var(--green)" }} />S&amp;P 500</span>}
        <span className="muted">1 year, % change</span>
      </div>
      <svg viewBox={`0 0 ${W} ${Ht}`} className="chart" role="img" aria-label={`1 year performance of ${ticker}`}>
        <line x1={PAD} x2={W - PAD} y1={zero} y2={zero} stroke="var(--line)" strokeDasharray="3 3" />
        {b && <path d={path(b)} fill="none" stroke="var(--green)" strokeWidth="1.5" />}
        <path d={path(a)} fill="none" stroke="var(--blue)" strokeWidth="1.8" />
      </svg>
    </div>
  );
}
