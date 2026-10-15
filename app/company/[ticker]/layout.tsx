import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lookupTicker } from "@/lib/sec";
import Sidebar from "@/components/Sidebar";
import SearchBox from "@/components/SearchBox";

export default async function CompanyLayout({ children, params }: { children: ReactNode; params: { ticker: string } }) {
  const co = await lookupTicker(params.ticker);
  if (!co) notFound();
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">FinSight</Link>
        <div className="who"><strong>{co.name}</strong><span className="muted"> {co.ticker}</span></div>
        <SearchBox />
      </header>
      <div className="body">
        <Sidebar ticker={co.ticker} />
        <section className="content">{children}</section>
      </div>
    </div>
  );
}
