// Everything that talks to the SEC lives in this file.
// The SEC asks for a User-Agent with your contact info, and allows ~10 requests/second.

const UA = process.env.SEC_USER_AGENT || "FinSight contact@example.com";
const HOUR = 3600;

async function secFetch(url: string, revalidate = HOUR) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate }, // Next.js remembers the answer so we don't re-ask the SEC every click
  });
  if (!res.ok) throw new Error(`SEC request failed (${res.status}): ${url}`);
  return res.json();
}

export type Company = { cik: string; ticker: string; name: string };

// Turns "AAPL" into the SEC's company number (the CIK).
export async function lookupTicker(ticker: string): Promise<Company | null> {
  const data = await secFetch("https://www.sec.gov/files/company_tickers.json", 86400);
  const t = decodeURIComponent(ticker).toUpperCase();
  for (const key of Object.keys(data)) {
    const r = data[key];
    if (r.ticker === t) {
      return { cik: String(r.cik_str).padStart(10, "0"), ticker: r.ticker, name: r.title };
    }
  }
  return null;
}

// Company profile + list of recent filings.
export async function getSubmissions(cik: string) {
  return secFetch(`https://data.sec.gov/submissions/CIK${cik}.json`);
}

// Every number the company has ever reported, tagged by concept. Large file (several MB).
export async function getCompanyFacts(cik: string) {
  const json = await secFetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
  return json.facts;
}

// Link to a filing. With the main document name we open the SEC's interactive viewer,
// otherwise we fall back to the filing's index page.
export function filingUrl(cik: string, accn: string, primaryDoc?: string) {
  const nodash = accn.replace(/-/g, "");
  const c = String(parseInt(cik, 10));
  if (primaryDoc) return `https://www.sec.gov/ix?doc=/Archives/edgar/data/${c}/${nodash}/${primaryDoc}`;
  return `https://www.sec.gov/Archives/edgar/data/${c}/${nodash}/${accn}-index.htm`;
}

// accession number -> main document file name
export function docMap(subs: any): Record<string, string> {
  const r = subs?.filings?.recent;
  const out: Record<string, string> = {};
  if (!r) return out;
  r.accessionNumber.forEach((a: string, i: number) => (out[a] = r.primaryDocument[i]));
  return out;
}


// Best-effort summary from the latest 10-K's Item 1 (Business), using only SEC filings.
export async function getBusinessDescription(cik: string, subs: any): Promise<string | null> {
  try {
    const recent = subs?.filings?.recent;
    if (!recent) return null;
    const idx = recent.form.findIndex((form: string, i: number) => form === "10-K" && i < 30);
    if (idx < 0) return null;
    const accession = recent.accessionNumber[idx];
    const document = recent.primaryDocument[idx];
    const url = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik, 10)}/${accession.replace(/-/g, "")}/${document}`;
    const response = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } });
    if (!response.ok) return null;
    const html = await response.text();
    const plain = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ");
    const start = plain.search(/Item\s+1[.\s]+Business\b/i);
    if (start < 0) return null;
    const rest = plain.slice(start + 10);
    const end = rest.search(/Item\s+1A[.\s]+Risk Factors\b/i);
    const section = (end > 300 ? rest.slice(0, end) : rest).trim();
    if (section.length < 100) return null;
    return section.slice(0, 2200).trim() + (section.length > 2200 ? "…" : "");
  } catch {
    return null;
  }
}
