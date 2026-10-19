import {lookupTicker,getSubmissions} from "@/lib/sec";
import BusinessDescription from "@/components/BusinessDescription";
export default async function SnapshotProfile({ticker}:{ticker:string}){
 const co=await lookupTicker(ticker);if(!co)return <p className="muted">Company not found.</p>;
 const subs=await getSubmissions(co.cik);const a=subs.addresses?.business??{},recent=subs.filings.recent,k=recent.form.findIndex((f:string)=>f==="10-K");
 return <><h3>Corporate Information</h3><dl><dt>Company Name</dt><dd>{co.name}</dd><dt>Headquarters</dt><dd>{[a.street1,a.street2,a.city,a.stateOrCountry,a.zipCode].filter(Boolean).join(", ")}</dd><dt>Exchange</dt><dd>{subs.exchanges?.join(", ")||"N/A"}</dd><dt>Phone</dt><dd>{subs.phone||"N/A"}</dd><dt>Website</dt><dd>{subs.website?<a href={subs.website.startsWith("http")?subs.website:"https://"+subs.website} target="_blank" rel="noopener noreferrer">Link</a>:"N/A"}</dd></dl><div className="profile-subsection"><h4>Business Description</h4><BusinessDescription description={null} filingUrl={k>=0?`https://www.sec.gov/ix?doc=/Archives/edgar/data/${parseInt(co.cik,10)}/${recent.accessionNumber[k].replace(/-/g,"")}/${recent.primaryDocument[k]}`:undefined}/></div><div className="profile-subsection"><h4>Sector &amp; Industry</h4><dl><dt>Industry (SIC)</dt><dd>{subs.sicDescription||"N/A"}</dd></dl></div></>;
}
