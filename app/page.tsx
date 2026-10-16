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
          <span className="home-rocket" aria-hidden="true"><span className="home-rocket-flame" /><span className="home-rocket-body">🚀</span></span>
        </div>
        <section className="home-orbit" aria-labelledby="lookup-title">
          <div className="orbit-glow" aria-hidden="true" />
          <div className="home-orbit-satellites" aria-hidden="true"><span className="home-orbit-track home-orbit-track-one"><i /></span><span className="home-orbit-track home-orbit-track-two"><i /></span></div>
          <div className="home-card">
            <img className="home-watermark-logo" src="/SBW%20Tree%20Logo.png" alt="" aria-hidden="true" />
            <div className="home-eyebrow"><span /> SBW RESEARCH TERMINAL</div>
            <h1 id="lookup-title">Look up a company</h1>
            <p className="muted">Explore company snapshots, financial statements, and SEC filings.</p>
            <SearchBox variant="large" />
            <div className="home-quick-links">
              <span>QUICK ACCESS</span>
              <Link href="/news"><strong>Today's top news</strong><small>Company and market headlines</small></Link>
              <Link href="/markets"><strong>Markets</strong><small>Major market quotes and overview</small></Link>
              <Link href="/watchlist"><strong>Watchlist</strong><small>Your saved stock lists</small></Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}