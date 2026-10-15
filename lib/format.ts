const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function colLabel(end: string) {
  const d = new Date(end + "T00:00:00Z");
  return `${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

export function money(n: number) {
  const a = Math.abs(n);
  if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US")}`;
}

export function cell(n: number, unit: "usd" | "eps" | "shares") {
  if (unit === "eps") return n.toFixed(2);
  return Math.round(n / 1e6).toLocaleString("en-US");
}
