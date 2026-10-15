import { notFound } from "next/navigation";
import { lookupTicker } from "@/lib/sec";
import { NAV } from "@/lib/nav";
import { STATEMENTS } from "@/lib/statements";
import StatementView from "@/components/StatementView";
import FilingsView from "@/components/FilingsView";

export default async function SubPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string; section: string; sub: string }>;
  searchParams: Promise<{ period?: string; range?: string }>;
}) {
  const [{ ticker, section: sectionId, sub }, query] = await Promise.all([params, searchParams]);
  const co = await lookupTicker(ticker);
  if (!co) notFound();
  const section = NAV.find((s) => s.id === sectionId);
  const item = section?.items.find((i) => i.id === sub);
  if (!section || !item) notFound();

  if (section.id === "financials" && STATEMENTS[item.id]) {
    const period = query.period === "annual" ? "annual" : "quarterly";
    return <StatementView cik={co.cik} ticker={co.ticker} sub={item.id} period={period} range={query.range ?? "all"} />;
  }
  if (section.id === "news" && item.id === "filings") return <FilingsView cik={co.cik} />;

  return (
    <div className="panel">
      <h2>{item.label}</h2>
      <p>This tab is not built yet. The navigation is in place so it can be filled in one tab at a time.</p>
    </div>
  );
}
