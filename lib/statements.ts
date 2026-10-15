// Turns the SEC's long unsorted list of tagged numbers into a formatted statement.
// Each line below says: "this row is built from these tags, try them in order".

export type Unit = "usd" | "eps" | "shares";
export type Cell = { value: number; accn: string; form: string; filed: string; derived?: boolean };
export type Column = { end: string; fp: string };
export type Row = { label: string; level: number; kind: "header" | "item" | "total"; unit: Unit; cells: (Cell | null)[] };
export type Statement = { title: string; columns: Column[]; rows: Row[] };
export type Period = "annual" | "quarterly";

type RawFact = { start?: string; end: string; val: number; accn: string; fy: number; fp: string; form: string; filed: string };
type Line = { label: string; level: number; kind: "header" | "item" | "total"; tags?: string[]; unit?: Unit; flip?: boolean };
export type Def = { title: string; type: "instant" | "duration"; anchor: string[]; lines: Line[] };
type CellFp = Cell & { fp: string };

const H = (label: string): Line => ({ label, level: 0, kind: "header" });
const I = (label: string, tags: string[], level = 1, extra: Partial<Line> = {}): Line => ({ label, level, kind: "item", tags, ...extra });
const T = (label: string, tags: string[], level = 0): Line => ({ label, level, kind: "total", tags });

export const STATEMENTS: Record<string, Def> = {
  "balance-sheet": {
    title: "Balance Sheet",
    type: "instant",
    anchor: ["Assets"],
    lines: [
      H("Assets"),
      I("Cash & Cash Equivalents", ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"]),
      I("Short-Term Investments", ["MarketableSecuritiesCurrent", "ShortTermInvestments", "AvailableForSaleSecuritiesDebtSecuritiesCurrent"]),
      I("Accounts Receivable, Net", ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent"]),
      I("Inventories", ["InventoryNet"]),
      I("Other Current Assets", ["OtherAssetsCurrent", "PrepaidExpenseAndOtherAssetsCurrent"]),
      T("Total Current Assets", ["AssetsCurrent"]),
      I("Net Property, Plant & Equipment", ["PropertyPlantAndEquipmentNet"]),
      I("Long-Term Investments", ["LongTermInvestments", "MarketableSecuritiesNoncurrent", "AvailableForSaleSecuritiesDebtSecuritiesNoncurrent"]),
      I("Goodwill", ["Goodwill"]),
      I("Intangible Assets", ["IntangibleAssetsNetExcludingGoodwill", "FiniteLivedIntangibleAssetsNet"]),
      I("Other Non-Current Assets", ["OtherAssetsNoncurrent"]),
      T("Total Assets", ["Assets"]),
      H("Liabilities"),
      I("Accounts Payable", ["AccountsPayableCurrent"]),
      I("Short-Term Debt", ["CommercialPaper", "LongTermDebtCurrent", "DebtCurrent", "ShortTermBorrowings"]),
      I("Deferred Revenue", ["ContractWithCustomerLiabilityCurrent", "DeferredRevenueCurrent"]),
      I("Other Current Liabilities", ["OtherLiabilitiesCurrent"]),
      T("Total Current Liabilities", ["LiabilitiesCurrent"]),
      I("Long-Term Debt", ["LongTermDebtNoncurrent", "LongTermDebt"]),
      I("Other Non-Current Liabilities", ["OtherLiabilitiesNoncurrent"]),
      T("Total Liabilities", ["Liabilities"]),
      H("Shareholders' Equity"),
      I("Common Stock & Paid-In Capital", ["CommonStocksIncludingAdditionalPaidInCapital", "AdditionalPaidInCapital", "CommonStockValue"]),
      I("Retained Earnings", ["RetainedEarningsAccumulatedDeficit"]),
      I("Accumulated Other Comprehensive Income", ["AccumulatedOtherComprehensiveIncomeLossNetOfTax"]),
      T("Total Shareholders' Equity", ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"]),
      T("Total Liabilities & Equity", ["LiabilitiesAndStockholdersEquity"]),
    ],
  },
  "income-statement": {
    title: "Income Statement",
    type: "duration",
    anchor: ["NetIncomeLoss", "ProfitLoss"],
    lines: [
      I("Revenue", ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet", "RevenueFromContractWithCustomerIncludingAssessedTax"], 0),
      I("Cost of Revenue", ["CostOfGoodsAndServicesSold", "CostOfRevenue", "CostOfGoodsSold"]),
      T("Gross Profit", ["GrossProfit"]),
      I("Research & Development", ["ResearchAndDevelopmentExpense"]),
      I("Selling, General & Administrative", ["SellingGeneralAndAdministrativeExpense"]),
      T("Total Operating Expenses", ["OperatingExpenses"]),
      T("Operating Income", ["OperatingIncomeLoss"]),
      I("Interest Expense", ["InterestExpense", "InterestExpenseNonoperating"]),
      I("Other Income (Expense), Net", ["NonoperatingIncomeExpense", "OtherNonoperatingIncomeExpense"]),
      T("Pre-Tax Income", ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments"]),
      I("Income Tax Expense", ["IncomeTaxExpenseBenefit"]),
      T("Net Income", ["NetIncomeLoss", "ProfitLoss"]),
      H("Per Share"),
      I("EPS, Basic ($)", ["EarningsPerShareBasic"], 1, { unit: "eps" }),
      I("EPS, Diluted ($)", ["EarningsPerShareDiluted"], 1, { unit: "eps" }),
      I("Diluted Shares Outstanding (M)", ["WeightedAverageNumberOfDilutedSharesOutstanding"], 1, { unit: "shares" }),
    ],
  },
  "cash-flow": {
    title: "Cash Flow",
    type: "duration",
    anchor: ["NetCashProvidedByUsedInOperatingActivities"],
    lines: [
      H("Operating Activities"),
      I("Net Income", ["NetIncomeLoss", "ProfitLoss"]),
      I("Depreciation & Amortization", ["DepreciationDepletionAndAmortization", "DepreciationAmortizationAndAccretionNet", "DepreciationAndAmortization"]),
      I("Stock-Based Compensation", ["ShareBasedCompensation"]),
      I("Deferred Income Taxes", ["DeferredIncomeTaxExpenseBenefit", "DeferredIncomeTaxesAndTaxCredits"]),
      T("Cash from Operations", ["NetCashProvidedByUsedInOperatingActivities"]),
      H("Investing Activities"),
      I("Capital Expenditures", ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"], 1, { flip: true }),
      T("Cash from Investing", ["NetCashProvidedByUsedInInvestingActivities"]),
      H("Financing Activities"),
      I("Dividends Paid", ["PaymentsOfDividends", "PaymentsOfDividendsCommonStock"], 1, { flip: true }),
      I("Share Repurchases", ["PaymentsForRepurchaseOfCommonStock"], 1, { flip: true }),
      T("Cash from Financing", ["NetCashProvidedByUsedInFinancingActivities"]),
    ],
  },
};

const UNIT_KEY: Record<Unit, string> = { usd: "USD", eps: "USD/shares", shares: "shares" };
const FORMS = new Set(["10-K", "10-Q"]);

// All reported values for one tag, one per period (latest filing wins, so restatements show up).
function series(facts: any, tag: string, unit: Unit): RawFact[] {
  const raw = facts?.["us-gaap"]?.[tag]?.units?.[UNIT_KEY[unit]] as RawFact[] | undefined;
  if (!raw) return [];
  const best = new Map<string, RawFact>();
  for (const f of raw) {
    if (!FORMS.has(f.form)) continue;
    const k = `${f.start ?? ""}|${f.end}`;
    const prev = best.get(k);
    if (!prev || f.filed > prev.filed) best.set(k, f);
  }
  return [...best.values()];
}

const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
// 1 = first quarter, 2 = six months, 3 = nine months, 4 = full year (all "year to date" lengths)
const bucket = (d: number) => (d >= 60 && d <= 110 ? 1 : d >= 150 && d <= 200 ? 2 : d >= 240 && d <= 290 ? 3 : d >= 340 && d <= 380 ? 4 : 0);
const toCell = (f: RawFact, fp: string): CellFp => ({ value: f.val, accn: f.accn, form: f.form, filed: f.filed, fp });

// Balance sheet items are a snapshot on one date, so there is nothing to calculate.
function instantMap(s: RawFact[], period: Period) {
  const m = new Map<string, CellFp>();
  for (const f of s) {
    if (f.start) continue;
    if (period === "annual" && f.form !== "10-K") continue;
    m.set(f.end, toCell(f, f.form === "10-K" ? "FY" : f.fp));
  }
  return m;
}

// Income and cash flow items cover a time span. 10-Qs report year-to-date, and there is no 10-Q for Q4,
// so single quarters are worked out by subtraction (Q2 = 6 months - 3 months, Q4 = full year - 9 months).
function durationMap(s: RawFact[], unit: Unit, period: Period) {
  const out = new Map<string, CellFp>();
  const d = s.filter((f) => f.start).map((f) => ({ f, b: bucket(days(f.start!, f.end)) }));
  if (period === "annual") {
    for (const { f, b } of d) if (b === 4 && f.form === "10-K") out.set(f.end, toCell(f, "FY"));
    return out;
  }
  if (unit !== "usd") {
    // per-share numbers can't be subtracted, so only use quarters the company reported directly
    for (const { f, b } of d) if (b === 1) out.set(f.end, toCell(f, f.fp === "FY" ? "Q4" : f.fp));
    return out;
  }
  const starts = new Set(d.filter(({ f, b }) => (b === 1 && f.fp === "Q1") || (b === 4 && f.fp === "FY")).map(({ f }) => f.start!));
  const diff = (a: RawFact, b: RawFact, fp: string): CellFp => ({ ...toCell(a, fp), value: a.val - b.val, derived: true });
  for (const st of starts) {
    const y: Record<number, RawFact> = {};
    for (const { f, b } of d) if (f.start === st && b) y[b] = f;
    if (y[1]) out.set(y[1].end, toCell(y[1], "Q1"));
    if (y[2] && y[1]) out.set(y[2].end, diff(y[2], y[1], "Q2"));
    if (y[3] && y[2]) out.set(y[3].end, diff(y[3], y[2], "Q3"));
    if (y[4] && y[3]) out.set(y[4].end, diff(y[4], y[3], "Q4"));
  }
  return out;
}

export function buildStatement(facts: any, def: Def, period: Period): Statement {
  const getMap = (tag: string, unit: Unit) => {
    const s = series(facts, tag, unit);
    return def.type === "instant" ? instantMap(s, period) : durationMap(s, unit, period);
  };

  // Columns = every period date found for the "anchor" line(s), newest first.
  const found = new Map<string, string>();
  for (const tag of def.anchor) for (const [end, c] of getMap(tag, "usd")) if (!found.has(end)) found.set(end, c.fp);
  const ends = [...found.keys()].sort().reverse().slice(0, period === "annual" ? 6 : 10);
  const columns: Column[] = ends.map((end) => ({ end, fp: found.get(end)! })).reverse(); // oldest left, newest right

  const rows: Row[] = def.lines.map((line) => {
    const unit = line.unit ?? "usd";
    if (!line.tags) return { label: line.label, level: line.level, kind: line.kind, unit, cells: columns.map(() => null) };
    const maps = line.tags.map((t) => getMap(t, unit)); // try each tag in order, first hit wins
    const cells = columns.map((col) => {
      for (const m of maps) {
        const c = m.get(col.end);
        if (c) return { value: line.flip ? -c.value : c.value, accn: c.accn, form: c.form, filed: c.filed, derived: c.derived };
      }
      return null;
    });
    return { label: line.label, level: line.level, kind: line.kind, unit, cells };
  });
  return { title: def.title, columns, rows };
}

// A few headline numbers for the Snapshot page.
export function snapshotFacts(facts: any) {
  const shares = facts?.dei?.EntityCommonStockSharesOutstanding?.units?.shares as RawFact[] | undefined;
  const latestShares = shares ? [...shares].sort((a, b) => (a.end < b.end ? 1 : -1))[0] : null;
  let revenue: { value: number; end: string } | null = null;
  for (const tag of STATEMENTS["income-statement"].lines[0].tags!) {
    const m = durationMap(series(facts, tag, "usd"), "usd", "annual");
    const end = [...m.keys()].sort().reverse()[0];
    if (end && (!revenue || end > revenue.end)) revenue = { value: m.get(end)!.value, end };
  }
  return { sharesOutstanding: latestShares?.val ?? null, revenue };
}
