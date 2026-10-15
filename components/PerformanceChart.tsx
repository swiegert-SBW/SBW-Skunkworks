"use client";
import { useMemo, useRef, useState } from "react";
import { RANGES, RangeKey, Series, buildModel, nearestIndex, niceTicks } from "@/lib/chartmath";

const W = 900, H = 330, ML = 12, MR = 58, MT = 12, MB = 28;

const pctText = (v: number | null) => (v == null ? "n/a" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`);
const cls = (v: number | null) => (v == null ? "" : v < 0 ? "neg" : "pos");
const fmtDate = (t: number, long: boolean) =>
  new Date(t * 1000).toLocaleDateString("en-US", long ? { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" } : { month: "short", year: "2-digit", timeZone: "UTC" });

export default function PerformanceChart({ stock, index, ticker }: { stock: Series; index: Series | null; ticker: string }) {
  const [range, setRange] = useState<RangeKey>("1Y");
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const m = useMemo(() => buildModel(stock, index, range), [stock, index, range]);

  const n = m.t.length;
  const vals = [...m.pct, ...(m.ipct ?? []).filter((v): v is number => v != null), 0];
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals), 6);
  const lo = ticks[0], hi = ticks[ticks.length - 1];
  const t0 = m.t[0], t1 = m.t[n - 1];
  const x = (t: number) => ML + ((t - t0) / (t1 - t0 || 1)) * (W - ML - MR);
  const y = (v: number) => MT + (1 - (v - lo) / (hi - lo || 1)) * (H - MT - MB);
  const line = (arr: (number | null)[]) => {
    let d = "", pen = false;
    arr.forEach((v, i) => {
      if (v == null) { pen = false; return; }
      d += `${pen ? "L" : "M"}${x(m.t[i]).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const xTicks = [0, 1, 2, 3, 4].map((k) => m.t[Math.round((k / 4) * (n - 1))]);
  const long = t1 - t0 < 1.2 * 365 * 86400;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const clamped = Math.min(Math.max(px, ML), W - MR);
    setHover(nearestIndex(m.t, t0 + ((clamped - ML) / (W - ML - MR)) * (t1 - t0)));
  };
  const h = hover != null && hover < n ? hover : null;
  const hx = h != null ? x(m.t[h]) : 0;

  return (
    <div>
      <div className="chart-top">
        <div className="legend">
          <span><i style={{ background: "var(--blue)" }} />{ticker} <b className={cls(m.pct[n - 1])}>{pctText(m.pct[n - 1])}</b></span>
          {m.ipct && <span><i style={{ background: "var(--green)" }} />S&amp;P 500 <b className={cls(m.ipct[n - 1])}>{pctText(m.ipct[n - 1])}</b></span>}
        </div>
        <div className="ranges" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r} className={r === range ? "on" : ""} aria-pressed={r === range} onClick={() => { setRange(r); setHover(null); }}>{r}</button>
          ))}
        </div>
      </div>

      <div className="chart-wrap">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`${range} percent change of ${ticker} compared with the S&P 500`}
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#5b6572" : "#262c34"} strokeDasharray={v === 0 ? "4 3" : undefined} />
              <text x={W - MR + 8} y={y(v) + 4} className="axis">{v > 0 ? "+" : ""}{v}%</text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <text key={i} x={x(t)} y={H - 8} className="axis" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{fmtDate(t, long)}</text>
          ))}
          {m.ipct && <path d={line(m.ipct)} fill="none" stroke="var(--green)" strokeWidth="1.5" />}
          <path d={line(m.pct)} fill="none" stroke="var(--blue)" strokeWidth="1.8" />
          {h != null && (
            <g>
              <line x1={hx} x2={hx} y1={MT} y2={H - MB} stroke="#8a94a1" strokeDasharray="3 3" />
              <circle cx={hx} cy={y(m.pct[h])} r="4" fill="var(--blue)" stroke="#0e1013" strokeWidth="1.5" />
              {m.ipct && m.ipct[h] != null && <circle cx={hx} cy={y(m.ipct[h]!)} r="4" fill="var(--green)" stroke="#0e1013" strokeWidth="1.5" />}
            </g>
          )}
        </svg>
        {h != null && (
          <div className="tip" style={{ left: `${(hx / W) * 100}%`, transform: hx > W * 0.6 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}>
            <div className="tip-date">{fmtDate(m.t[h], true)}</div>
            <div className="tip-row"><i style={{ background: "var(--blue)" }} /><b>{ticker}</b> ${m.c[h].toFixed(2)}</div>
            <div className="tip-sub">Since start of range <b className={cls(m.pct[h])}>{pctText(m.pct[h])}</b></div>
            <div className="tip-sub">That day <b className={cls(m.day[h])}>{pctText(m.day[h])}</b></div>
            {m.ipct && m.ic && m.ic[h] != null && (
              <>
                <div className="tip-row"><i style={{ background: "var(--green)" }} /><b>S&amp;P 500</b> {m.ic[h]!.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                <div className="tip-sub">Since start of range <b className={cls(m.ipct[h])}>{pctText(m.ipct[h])}</b></div>
                <div className="tip-sub">That day <b className={cls(m.iday![h])}>{pctText(m.iday![h])}</b></div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
