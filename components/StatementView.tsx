import Link from "next/link";
import { getStatement } from "@/lib/data";
import { colLabel, cell } from "@/lib/format";
import type { Period } from "@/lib/statements";

export default async function StatementView({ cik, ticker, sub, period }: { cik: string; ticker: string; sub: string; period: Period }) {
  let data;
  try {
    data = await getStatement(cik, sub, period);
  } catch (e) {
    return (
      <div className="panel">
        <h2>Could not load the statement</h2>
        <p>The SEC did not return data. Check that SEC_USER_AGENT is set to your real name and email, then refresh.</p>
        <p className="muted">{String((e as Error).message)}</p>
      </div>
    );
  }
  const base = `/company/${ticker}/financials/${sub}`;
  if (!data.columns.length) {
    return <div className="panel"><h2>{data.title}</h2><p>No filings with this data were found for this company.</p></div>;
  }
  return (
    <div className="panel">
      <div className="stmt-head">
        <h2>{data.title}</h2>
        <div className="stmt-tools">
          <div className="toggle">
            <Link href={`${base}?period=quarterly`} className={period === "quarterly" ? "on" : ""}>Quarterly</Link>
            <Link href={`${base}?period=annual`} className={period === "annual" ? "on" : ""}>Annual</Link>
          </div>
          <a className="btn" href={`/api/export/${ticker}/${sub}?period=${period}`}>Download Excel</a>
        </div>
      </div>
      <p className="muted small">USD in millions, except per share. Oldest period is on the left, newest on the right. Click any figure to open the filing it came from. Italic figures are calculated (for example Q4 = full year minus nine months) and link to the later filing.</p>
      <div className="table-wrap">
        <table className="stmt">
          <thead>
            <tr>
              <th />
              {data.columns.map((c) => (
                <th key={c.end}>
                  <div>{colLabel(c.end)}</div>
                  <div className="fp">{c.fp}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} className={r.kind}>
                <td style={{ paddingLeft: 12 + r.level * 18 }}>{r.label}</td>
                {r.cells.map((c, j) => (
                  <td key={j} className="num">
                    {c ? (
                      <a
                        href={data.links[c.accn]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={(c.value < 0 ? "neg " : "") + (c.derived ? "derived" : "")}
                        title={`${c.form} filed ${c.filed}${c.derived ? " (calculated)" : ""}`}
                      >
                        {cell(c.value, r.unit)}
                      </a>
                    ) : r.kind === "header" ? null : (
                      <span className="muted">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
