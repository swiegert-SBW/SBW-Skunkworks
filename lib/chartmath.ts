export type Series = { t: number[]; c: number[] };
export const RANGES = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y"] as const;
export type RangeKey = (typeof RANGES)[number];

const DAY = 86400;
const dayKey = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);

// Where the chosen date range starts in the list of prices.
export function startIndex(t: number[], range: RangeKey): number {
  const last = t[t.length - 1];
  if (range === "YTD") {
    const jan1 = Date.UTC(new Date(last * 1000).getUTCFullYear(), 0, 1) / 1000;
    for (let i = t.length - 1; i >= 0; i--) if (t[i] < jan1) return i; // last close of the prior year
    return 0;
  }
  const span = { "1M": 30, "3M": 91, "6M": 182, "1Y": 365, "3Y": 1096, "5Y": 1826 }[range] * DAY;
  const i = t.findIndex((x) => x >= last - span);
  return i < 0 ? 0 : i;
}

// Lines up the index prices with the stock's dates (carrying the last value over holidays).
export function align(stockT: number[], idx: Series): (number | null)[] {
  const m = new Map<string, number>();
  idx.t.forEach((t, i) => m.set(dayKey(t), idx.c[i]));
  let last: number | null = null;
  return stockT.map((t) => {
    const v = m.get(dayKey(t));
    if (v != null) last = v;
    return last;
  });
}

// Round-number tick marks for the % axis.
export function niceTicks(min: number, max: number, count = 6): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.floor(min / step) * step; ; v += step) {
    out.push(+v.toFixed(10));
    if (v >= max - step * 0.001) break; // stop at the first tick that covers the highest value
  }
  return out;
}

export function nearestIndex(t: number[], target: number): number {
  let lo = 0, hi = t.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid] < target) lo = mid; else hi = mid;
  }
  return Math.abs(t[lo] - target) <= Math.abs(t[hi] - target) ? lo : hi;
}

export type Model = {
  t: number[]; c: number[]; pct: number[]; day: (number | null)[];
  ic: (number | null)[] | null; ipct: (number | null)[] | null; iday: (number | null)[] | null;
};

// Everything the chart needs for one date range: % change since the start, and the one-day change.
export function buildModel(stock: Series, index: Series | null, range: RangeKey): Model {
  const s = startIndex(stock.t, range);
  const t = stock.t.slice(s), c = stock.c.slice(s);
  const base = c[0];
  const pct = c.map((v) => (v / base - 1) * 100);
  const day = c.map((v, i) => {
    const prev = i === 0 ? stock.c[s - 1] : c[i - 1];
    return prev ? (v / prev - 1) * 100 : null;
  });
  let ic: (number | null)[] | null = null, ipct = null as Model["ipct"], iday = null as Model["iday"];
  if (index && index.t.length > 1) {
    const full = align(stock.t, index);
    ic = full.slice(s);
    const ibase = ic.find((v) => v != null) ?? null;
    ipct = ic.map((v) => (v == null || ibase == null ? null : (v / ibase - 1) * 100));
    iday = ic.map((v, i) => {
      const prev = i === 0 ? full[s - 1] : ic![i - 1];
      return v != null && prev ? (v / prev - 1) * 100 : null;
    });
  }
  return { t, c, pct, day, ic, ipct, iday };
}
