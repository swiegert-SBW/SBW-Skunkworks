import { getSubmissions, filingUrl } from "@/lib/sec";

export default async function FilingsView({ cik }: { cik: string }) {
  const subs = await getSubmissions(cik);
  const r = subs.filings.recent;
  const rows = r.accessionNumber.slice(0, 80).map((a: string, i: number) => ({
    accn: a, form: r.form[i], date: r.filingDate[i], doc: r.primaryDocument[i], desc: r.primaryDocDescription[i],
  }));
  return (
    <div className="panel">
      <h2>Filings</h2>
      <p className="muted small">The 80 most recent filings on SEC EDGAR.</p>
      <table className="list">
        <thead><tr><th>Date</th><th>Form</th><th>Description</th></tr></thead>
        <tbody>
          {rows.map((f: any) => (
            <tr key={f.accn}>
              <td>{f.date}</td>
              <td>{f.form}</td>
              <td><a href={filingUrl(cik, f.accn, f.doc)} target="_blank" rel="noopener noreferrer">{f.desc || f.doc}</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
