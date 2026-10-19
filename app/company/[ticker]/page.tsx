import {Suspense} from "react";
import SnapshotContent from "@/components/SnapshotContent";
export default function Snapshot({params}:{params:Promise<{ticker:string}>}){
 return <Suspense fallback={<div className="panel"><div className="skeleton-title">Loading company overview…</div><div className="skeleton-chart"/></div>}><SnapshotContent params={params}/></Suspense>;
}
