import ExcelJS from "exceljs";
import { colLabel } from "./format";
import type { Statement } from "./statements";

type Data = Statement & { links: Record<string, string> };

// Builds the .xlsx file: a "Statement" sheet with real numbers, and a "Sources" sheet with links to the SEC filings.
export async function statementToXlsx(company: string, ticker: string, data: Data, period: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SBW Workstation";
  const ws = wb.addWorksheet("Statement", { views: [{ state: "frozen", xSplit: 1, ySplit: 4 }] });

  ws.getCell("A1").value = `${company} (${ticker}) - ${data.title}`;
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A2").value = `USD in millions, except per share. ${period === "annual" ? "Annual" : "Quarterly"}. Italic figures are calculated from year-to-date filings.`;
  ws.getCell("A2").font = { italic: true, color: { argb: "FF666666" } };

  const head = ws.getRow(4);
  head.getCell(1).value = "";
  data.columns.forEach((c, i) => (head.getCell(i + 2).value = `${colLabel(c.end)} ${c.fp}`));
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.eachCell({ includeEmpty: true }, (cell, n) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
    cell.alignment = { horizontal: n === 1 ? "left" : "right" };
  });

  data.rows.forEach((r, ri) => {
    const row = ws.getRow(5 + ri);
    const label = row.getCell(1);
    label.value = r.label;
    label.alignment = { indent: r.level };
    if (r.kind !== "item") row.font = { bold: true };
    r.cells.forEach((c, ci) => {
      if (!c) return;
      const cell = row.getCell(ci + 2);
      cell.value = r.unit === "eps" ? c.value : c.value / 1e6;
      cell.numFmt = r.unit === "eps" ? "0.00;[Red]-0.00" : "#,##0;[Red]-#,##0";
      cell.font = { bold: r.kind !== "item", italic: !!c.derived };
    });
    if (r.kind === "total") row.eachCell({ includeEmpty: true }, (cell) => (cell.border = { top: { style: "thin" } }));
  });
  ws.getColumn(1).width = 42;
  for (let i = 0; i < data.columns.length; i++) ws.getColumn(i + 2).width = 13;

  // Sources sheet: one line per filing used
  const src = wb.addWorksheet("Sources");
  src.addRow(["Form", "Filed", "Used for periods ending", "Link to filing"]).font = { bold: true };
  const used = new Map<string, { form: string; filed: string; ends: Set<string> }>();
  data.rows.forEach((r) =>
    r.cells.forEach((c, ci) => {
      if (!c) return;
      const u = used.get(c.accn) ?? { form: c.form, filed: c.filed, ends: new Set<string>() };
      u.ends.add(data.columns[ci].end);
      used.set(c.accn, u);
    })
  );
  [...used.entries()]
    .sort((a, b) => (a[1].filed < b[1].filed ? 1 : -1))
    .forEach(([accn, u]) => {
      const url = data.links[accn];
      const row = src.addRow([u.form, u.filed, [...u.ends].sort().join(", "), url ? { text: url, hyperlink: url } : accn]);
      if (url) row.getCell(4).font = { color: { argb: "FF0563C1" }, underline: true };
    });
  src.columns = [{ width: 8 }, { width: 12 }, { width: 44 }, { width: 90 }];

  return Buffer.from(await wb.xlsx.writeBuffer());
}
