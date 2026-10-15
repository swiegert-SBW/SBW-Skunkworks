import Link from "next/link";
import SearchBox from "./SearchBox";

const NAV: { label: string; href?: string }[] = [
  { label: "Today's Top News" }, { label: "Markets" }, { label: "Company/Security", href: "/" }, { label: "Ownership" },
  { label: "Calendar" }, { label: "Filings" }, { label: "Screening" }, { label: "Watchlist" }, { label: "Industry" }, { label: "Deals" },
];

export default function TopBar() {
  return (
    <header>
      <div className="topbar">
        <Link href="/" className="brand">SBW Workstation</Link>
        <SearchBox variant="pill" />
      </div>
      <nav className="mainnav" aria-label="Main">
        {NAV.map((n) =>
          n.href ? (
            <Link key={n.label} href={n.href} className="active">{n.label}</Link>
          ) : (
            <span key={n.label} className="soon" title="Coming soon">{n.label}</span>
          )
        )}
      </nav>
    </header>
  );
}
