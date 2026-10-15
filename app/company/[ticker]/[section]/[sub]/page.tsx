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
  params: { ticker: string; section: string; sub: string };
  searchParams: { period?: string; range?: string };
}) {
  const co = await lookupTicker(params.ticker);
  if (!co) notFound();
  const section = NAV.find((s) => s.id === params.section);
  const item = section?.items.find((i) => i.id === params.sub);
  if (!section || !item) notFound();

  if (section.id === "financials" && STATEMENTS[item.id]) {
    const period = searchParams.period === "annual" ? "annual" : "quarterly";
    return <StatementView cik={co.cik} ticker={co.ticker} sub={item.id} period={period} range={searchParams.range ?? "all"} />;
  }
  if (section.id === "news" && item.id === "filings") return <FilingsView cik={co.cik} />;

  return (
    <div className="panel">
      <h2>{item.label}</h2>
      <p>This tab is not built yet. The navigation is in place so it can be filled in one tab at a time.</p>
    </div>
  );
}
