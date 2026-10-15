"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SearchBox from "./SearchBox";

const NAV = [
  { label: "Today's Top News", href: "/news" },
  { label: "Markets", href: "/markets" },
  { label: "Company/Security", href: "/" },
  { label: "Ownership", href: "/ownership" },
  { label: "Calendar", href: "/calendar" },
  { label: "Filings", href: "/filings" },
  { label: "Screening", href: "/screening" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Industry", href: "/industry" },
  { label: "Deals", href: "/deals" },
];

const LAST_COMPANY_KEY = "sbw-last-company-ticker";

export default function TopBar() {
  const pathname = usePathname() || "/";
  const isCompanySnapshot = pathname.startsWith("/company/");
  const [lastCompanyPath, setLastCompanyPath] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(LAST_COMPANY_KEY);
    if (saved) setLastCompanyPath(`/company/${encodeURIComponent(saved)}`);
  }, []);

  useEffect(() => {
    const match = pathname.match(/^\/company\/([^/]+)/);
    if (match) {
      const ticker = decodeURIComponent(match[1]).toUpperCase();
      window.localStorage.setItem(LAST_COMPANY_KEY, ticker);
      setLastCompanyPath(`/company/${encodeURIComponent(ticker)}`);
    }
  }, [pathname]);

  const activeHref = isCompanySnapshot ? "/" : pathname === "/" ? "" : pathname;
  return (
    <header>
      <div className="topbar">
        <Link href="/" className="brand">SBW Workstation</Link>
        <SearchBox variant="pill" />
      </div>
      <nav className="mainnav" aria-label="Main">
        {NAV.map((n) => {
          const active = n.href === "/" ? isCompanySnapshot : activeHref === n.href;
          const href = n.href === "/" && lastCompanyPath ? lastCompanyPath : n.href;
          return <Link key={n.label} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>{n.label}</Link>;
        })}
      </nav>
    </header>
  );
}
