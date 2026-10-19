"use client";
import {useMemo,useState} from "react";
type Filing={accn:string;form:string;date:string;doc:string;desc:string;url:string};
export default function FilingsTable({rows}:{rows:Filing[]}){
 const [form,setForm]=useState("All forms"),[year,setYear]=useState("All years");
 const forms=useMemo(()=>Array.from(new Set(rows.map(r=>r.form))).sort(),[rows]);
 const years=useMemo(()=>Array.from(new Set(rows.map(r=>r.date.slice(0,4)))).sort().reverse(),[rows]);
 const filtered=rows.filter(r=>(form==="All forms"||r.form===form)&&(year==="All years"||r.date.startsWith(year)));
 return <div className="panel"><h2>SEC Filings</h2><div className="filing-filters"><label>Form type<select value={form} onChange={e=>setForm(e.target.value)}><option>All forms</option>{forms.map(v=><option key={v}>{v}</option>)}</select></label><label>Year<select value={year} onChange={e=>setYear(e.target.value)}><option>All years</option>{years.map(v=><option key={v}>{v}</option>)}</select></label><span className="muted small">{filtered.length} filings</span></div><div className="table-wrap"><table className="list"><thead><tr><th>Date</th><th>Form</th><th>Description</th></tr></thead><tbody>{filtered.map(f=><tr key={f.accn}><td>{f.date}</td><td>{f.form}</td><td><a href={f.url} target="_blank" rel="noopener noreferrer">{f.desc||f.doc}</a></td></tr>)}</tbody></table></div>{!filtered.length&&<p className="muted">No filings match these filters.</p>}</div>;
}
