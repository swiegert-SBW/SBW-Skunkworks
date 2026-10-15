import SearchBox from "@/components/SearchBox";
import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <h1>FinSight</h1>
      <p>Company research built on SEC filings. Enter a ticker to start.</p>
      <SearchBox large />
      <p className="muted small">
        Try <Link href="/company/AAPL">AAPL</Link>, <Link href="/company/MSFT">MSFT</Link> or <Link href="/company/NVDA">NVDA</Link>.
      </p>
    </main>
  );
}
