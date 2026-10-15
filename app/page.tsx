import SearchBox from "@/components/SearchBox";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="pagebar">Company/Security</div>
      <main className="home-stage">
        <div className="starfield" aria-hidden="true">
          <span className="shooting-star shooting-star-one" />
          <span className="shooting-star shooting-star-two" />
          <span className="shooting-star shooting-star-three" />
        </div>
        <section className="home-orbit" aria-labelledby="lookup-title">
          <div className="orbit-glow" aria-hidden="true" />
          <img className="home-watermark-logo" src="/sbw-logo.svg" alt="" aria-hidden="true" />
          <div className="home-card">
            <div className="home-eyebrow"><span /> SBW RESEARCH TERMINAL</div>
            <h1 id="lookup-title">Look up a company</h1>
            <p className="muted">Explore company snapshots, financial statements, and SEC filings.</p>
            <SearchBox variant="large" />
            <p className="muted small home-examples">
              QUICK ACCESS&nbsp;&nbsp; <Link href="/company/AAPL">AAPL</Link><span> / </span><Link href="/company/MSFT">MSFT</Link><span> / </span><Link href="/company/NVDA">NVDA</Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
