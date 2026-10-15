import { NextResponse } from "next/server";
import { lookupTicker } from "@/lib/sec";
import { getStatement } from "@/lib/data";
import { STATEMENTS } from "@/lib/statements";
import { statementToXlsx } from "@/lib/excel";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { ticker: string; statement: string } }) {
  try {
    const co = await lookupTicker(params.ticker);
    if (!co || !STATEMENTS[params.statement]) return new NextResponse("Not found", { status: 404 });
    const period = new URL(req.url).searchParams.get("period") === "annual" ? "annual" : "quarterly";
    const data = await getStatement(co.cik, params.statement, period);
    const file = await statementToXlsx(co.name, co.ticker, data, period);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${co.ticker}-${params.statement}-${period}.xlsx"`,
      },
    });
  } catch (e) {
    return new NextResponse(`Could not build the file: ${(e as Error).message}`, { status: 502 });
  }
}
