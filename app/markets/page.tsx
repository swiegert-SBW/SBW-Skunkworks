import Link from "next/link";

export default function MarketsPage() {
  return (
    <>
      <div className="pagebar">Markets</div>
      <main className="market-map-page">
        <h1>Markets</h1>
        <p className="muted">The stock heatmap has been removed. Major market quotes and your scrolling watchlist ticker remain available at the top of the workstation.</p>
        <p><Link href="/watchlist">View your watchlists</Link></p>
      </main>
    </>
  );
}
