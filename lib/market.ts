// Market data uses Yahoo Finance's unofficial chart endpoint. Quotes are cached for 15 minutes;
// actual freshness depends on Yahoo's feed and may be delayed. Fail softly when unavailable.
export type Chart = {
  price: number;
  prevClose: number;
  high52: number;
  low52: number;
  volume: number;
  open?: number;
  firstTradeDate?: number;
  dividendRate?: number;
  exDividendDate?: number;
  points: { t: number; c: number }[];
};

export async function getChart(symbol: string, range = "1y"): Promise<Chart | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 900 } });
    if (!res.ok) return null;
    const r = (await res.json())?.chart?.result?.[0];
    if (!r) return null;
    const closes: (number | null)[] = r.indicators.quote[0].close;
    const points = r.timestamp
      .map((t: number, i: number) => ({ t, c: closes[i] }))
      .filter((p: { t: number; c: number | null }) => p.c != null) as { t: number; c: number }[];
    const price = r.meta.regularMarketPrice;
    const prevClose = r.meta.previousClose ?? (points.length > 1 ? points[points.length - 2].c : r.meta.chartPreviousClose ?? price);
    if (typeof price !== "number" || typeof prevClose !== "number") return null;
    return {
      price,
      prevClose,
      high52: r.meta.fiftyTwoWeekHigh,
      low52: r.meta.fiftyTwoWeekLow,
      volume: r.meta.regularMarketVolume,
      open: r.indicators?.quote?.[0]?.open?.at(-1) ?? undefined,
      firstTradeDate: r.meta.firstTradeDate,
      dividendRate: r.meta.trailingAnnualDividendRate,
      exDividendDate: r.meta.exDividendDate,
      points,
    };
  } catch {
    return null;
  }
}
