import {Suspense} from "react";
import SnapshotMarket from "@/components/SnapshotMarket";
import SnapshotProfile from "@/components/SnapshotProfile";
import SnapshotFundamentals from "@/components/SnapshotFundamentals";
import {lookupTicker} from "@/lib/sec";
async function Fundamentals({ticker}:{ticker:string}){const co=await lookupTicker(ticker);return co?<SnapshotFundamentals cik={co.cik} price={null}/>:null}
export default async function Snapshot({params}:{params:Promise<{ticker:string}>}){
 const {ticker}=await params;const symbol=ticker.toUpperCase();
 return <div className="snapshot"><aside className="profile panel"><Suspense fallback={<p className="muted">Loading corporate information…</p>}><SnapshotProfile ticker={symbol}/></Suspense></aside><div className="main-col"><Suspense fallback={<div className="panel"><h3>Performance</h3><div className="skeleton-chart"/></div>}><SnapshotMarket ticker={symbol}/></Suspense><div className="panel"><h3>SEC Fundamentals</h3><Suspense fallback={<p className="muted small">Loading reported fundamentals…</p>}><Fundamentals ticker={symbol}/></Suspense></div></div></div>;
}
