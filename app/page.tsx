import SearchBox from "@/components/SearchBox";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="pagebar">Company/Security</div>
      <main className="home">
        <h1>Look up a company</h1>
        <p className="muted">Enter a ticker to open its snapshot, financial statements, and SEC filings.</p>
        <SearchBox variant="large" />
        <p className="muted small">
          Try <Link href="/company/AAPL">AAPL</Link>, <Link href="/company/MSFT">MSFT</Link> or <Link href="/company/NVDA">NVDA</Link>.
        </p>
      </main>
    </>
  );
}
