// Prices come from Yahoo Finance's public chart endpoint. It is unofficial and can change or block requests,
// so every call fails softly (returns null) and the page still loads.
export type Chart = {
  price: number;
  prevClose: number;
  high52: number;
  low52: number;
  volume: number;
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
    return {
      price: r.meta.regularMarketPrice,
      prevClose: points.length > 1 ? points[points.length - 2].c : r.meta.chartPreviousClose,
      high52: r.meta.fiftyTwoWeekHigh,
      low52: r.meta.fiftyTwoWeekLow,
      volume: r.meta.regularMarketVolume,
      points,
    };
  } catch {
    return null;
  }
}
