import { unstable_cache } from "next/cache";
import { getCompanyFacts, getSubmissions, docMap, filingUrl } from "./sec";
import { buildStatement, snapshotFacts, STATEMENTS, Period, Statement } from "./statements";

// The SEC file for one company is several MB. These wrappers keep only the small result, for one hour.
export const getStatement = unstable_cache(
  async (cik: string, key: string, period: Period): Promise<Statement & { links: Record<string, string> }> => {
    const [facts, subs] = await Promise.all([getCompanyFacts(cik), getSubmissions(cik)]);
    const st = buildStatement(facts, STATEMENTS[key], period);
    const docs = docMap(subs);
    const links: Record<string, string> = {};
    for (const row of st.rows) for (const c of row.cells) if (c) links[c.accn] = filingUrl(cik, c.accn, docs[c.accn]);
    return { ...st, links };
  },
  ["statement-v2"],
  { revalidate: 3600 }
);

export const getFundamentals = unstable_cache(
  async (cik: string) => snapshotFacts(await getCompanyFacts(cik)),
  ["fundamentals-v1"],
  { revalidate: 3600 }
);
