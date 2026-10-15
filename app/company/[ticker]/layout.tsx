import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { lookupTicker } from "@/lib/sec";
import Sidebar from "@/components/Sidebar";

export default async function CompanyLayout({ children, params }: { children: ReactNode; params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const co = await lookupTicker(ticker);
  if (!co) notFound();
  return (
    <>
      <div className="pagebar">{co.name} <span className="muted">{co.ticker}</span></div>
      <div className="body">
        <Sidebar ticker={co.ticker} />
        <section className="content">{children}</section>
      </div>
    </>
  );
}
