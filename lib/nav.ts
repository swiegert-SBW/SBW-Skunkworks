export type NavSection = { id: string; label: string; items: { id: string; label: string }[] };

const items = (pairs: [string, string][]) => pairs.map(([id, label]) => ({ id, label }));

export const NAV: NavSection[] = [
  {
    id: "overviews",
    label: "Overviews",
    items: items([
      ["snapshot", "Snapshot"], ["entity-structure", "Entity Structure"], ["event-calendar", "Event Calendar"], ["comps", "Comps"],
      ["nav-cap-rates", "NAV & Cap Rates"], ["properties", "Properties"], ["supply-chain", "Supply Chain"],
      ["capital-structure", "Capital Structure"], ["rbics-rev", "RBICS Rev"], ["geo-rev", "GeoRev"], ["reference", "Reference"], ["esg", "ESG"],
    ]),
  },
  { id: "charts", label: "Charts", items: items([["price-chart", "Price Chart"], ["financial-chart", "Fundamental Charts"]]) },
  { id: "news", label: "News, Research, and Filings", items: items([["filings", "Filings"], ["news", "News"]]) },
  { id: "ownership", label: "Ownership", items: items([["overview", "Ownership Overview"]]) },
  { id: "financials", label: "Financials", items: items([["balance-sheet", "Balance Sheet"], ["income-statement", "Income Statement"], ["cash-flow", "Cash Flow"]]) },
  { id: "estimates", label: "Estimates", items: items([["consensus", "Consensus"]]) },
  { id: "credit", label: "Credit Analysis", items: items([["ratios", "Ratios"]]) },
  { id: "transactions", label: "Transactions", items: items([["deals", "Deals"]]) },
];

export function href(ticker: string, section: string, item: string) {
  if (section === "overviews" && item === "snapshot") return `/company/${ticker}`;
  return `/company/${ticker}/${section}/${item}`;
}
