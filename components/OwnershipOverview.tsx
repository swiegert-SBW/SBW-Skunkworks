import {lookupTicker,getSubmissions,filingUrl} from "@/lib/sec";
export default async function OwnershipOverview({ticker}:{ticker:string}){
 const co=await lookupTicker(ticker);
 if(!co)return <div className="panel">Company not found.</div>;
 let recent:{form:string[];filingDate:string[];accessionNumber:string[];primaryDocument:string[]} | null=null;
 try{const subs=await getSubmissions(co.cik);recent=subs.filings?.recent??null}catch{}
 const filings=recent?recent.form.map((form,i)=>({form,date:recent!.filingDate[i],accession:recent!.accessionNumber[i],document:recent!.primaryDocument[i]})).filter(x=>["3","4","5","3/A","4/A","5/A"].includes(x.form)).slice(0,40):[];
 const secSearch="https://www.sec.gov/edgar/search/#/entityName="+encodeURIComponent(co.name)+"&forms=13F-HR";
 const heading:React.CSSProperties={fontSize:14,fontWeight:650,margin:"0 0 12px"};
 const cell:React.CSSProperties={padding:"10px 12px",borderBottom:"1px solid var(--border,#283447)",textAlign:"left",fontSize:12};
 return <div style={{display:"grid",gap:16}}>
  <div className="panel"><h2 style={{margin:"0 0 5px"}}>Ownership Overview · {ticker}</h2><p className="muted small" style={{margin:0}}>Institutional ownership and insider filings · SEC EDGAR public disclosures</p></div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12}}>
   {([["Institutional Ownership","N/A","A complete institutional ownership percentage requires issuer-level 13F aggregation and shares outstanding."],["Insider Ownership","N/A","SEC Forms 3, 4 and 5 are transaction disclosures, not a complete live ownership register."],["Active / Passive Split","N/A","Investment-style classifications are not published in SEC filings."],["Latest Insider Filings",String(filings.length), "Recent available Forms 3, 4 and 5 (up to 40)."]] as const).map(([label,value,description])=><div className="panel" key={label}><div className="muted small">{label}</div><div style={{fontSize:27,fontWeight:700,margin:"8px 0"}}>{value}</div><div className="muted small">{description}</div></div>)}
  </div>
  <div className="panel"><h3 style={heading}>Institutional Ownership</h3><p className="muted small">13F filings identify reporting investment managers and certain long U.S. security positions. They are generally filed up to 45 days after quarter-end. A reliable top-holders table needs issuer-level aggregation, security identifier matching, and deduplication of overlapping managers. No fabricated holdings are displayed.</p><a href={secSearch} target="_blank" rel="noopener noreferrer">Explore institutional 13F filings at SEC EDGAR ↗</a></div>
  <div className="panel"><h3 style={heading}>Insider Filings</h3><p className="muted small">Source: SEC EDGAR. Form 4 generally reports insider transactions; Form 3 is an initial beneficial ownership statement and Form 5 reports certain annual changes. Filings are not equivalent to net insider ownership.</p>
   <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Filed","Form","SEC Filing"].map(x=><th key={x} style={cell}>{x}</th>)}</tr></thead><tbody>{filings.map((f,i)=><tr key={f.accession+"-"+i}><td style={cell}>{f.date}</td><td style={cell}>{f.form}</td><td style={cell}><a href={filingUrl(co.cik,f.accession,f.document)} target="_blank" rel="noopener noreferrer">View filing ↗</a></td></tr>)}</tbody></table>{filings.length===0&&<p className="muted small">No recent insider filings available from the SEC feed.</p>}</div>
  </div>
  <div className="panel"><h3 style={heading}>Data Coverage</h3><p className="muted small">This initial version uses free SEC filings. Holder rankings, ownership history, institutional concentration, ownership changes, and active/passive analysis remain unavailable until a validated holdings feed is integrated. Unavailable fields are explicitly marked rather than estimated.</p></div>
 </div>;
}
