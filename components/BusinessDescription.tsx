"use client";

import { useState } from "react";

export default function BusinessDescription({ description, filingUrl }: { description: string | null; filingUrl?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!description) return <p className="muted small">Description unavailable from free SEC data. {filingUrl && <><a href={filingUrl} target="_blank" rel="noopener noreferrer">Read the latest 10-K</a>.</>}</p>;
  return (
    <div className="business-description">
      <p className={expanded ? "small" : "small description-clamped"}>{description}</p>
      {description.length > 260 && <button className="text-toggle" type="button" onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Read more"}</button>}
      {filingUrl && <> <a className="small" href={filingUrl} target="_blank" rel="noopener noreferrer">Latest 10-K</a></>}
    </div>
  );
}
