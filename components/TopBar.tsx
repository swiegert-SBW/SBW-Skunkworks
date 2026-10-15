"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function TopBar() {
  const pathname = usePathname() || "/";
  const isCompanySnapshot = pathname.startsWith("/company/");
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
          return <Link key={n.label} href={n.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>{n.label}</Link>;
        })}
      </nav>
    </header>
  );
}
