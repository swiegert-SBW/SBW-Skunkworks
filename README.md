# SBW Workstation

A company research site built on free SEC data. Tabs and subtabs on the left, company pages on the right.

## What works now
- Ticker search, dark workstation layout with live market strip
- Statements show oldest period on the left, newest on the right, with a Download Excel button
- Snapshot chart: date ranges, % axis, hover to see % change
- Snapshot: company profile, price chart vs S&P 500, key stats
- Financials: Balance Sheet, Income Statement, Cash Flow (quarterly or annual). Click any figure to open the SEC filing it came from.
- News, Research, and Filings > Filings: recent SEC filings with links
- All other tabs are in the menu with a "not built yet" page

## Run it on your computer
1. Install Node.js (the LTS version) from nodejs.org
2. In this folder, run: `npm install`
3. Copy `.env.example` to `.env.local` and put your real name and email in it. The SEC requires this.
4. Run: `npm run dev`
5. Open http://localhost:3000

## Put it online (GitHub + Vercel)
1. Create a new empty repository on github.com
2. Upload this folder to it (or use `git init`, `git add .`, `git commit`, `git remote add origin ...`, `git push`)
3. On vercel.com, sign in with GitHub, click Add New > Project, pick the repository, and click Deploy
4. In the Vercel project, go to Settings > Environment Variables and add SEC_USER_AGENT (your name and email). Then redeploy.

From then on, every time you push a change to GitHub, Vercel publishes it automatically.

## Where things live
- `lib/sec.ts`: all SEC requests
- `lib/statements.ts`: the rules that turn SEC numbers into statements (edit the line lists to add or change rows)
- `lib/nav.ts`: the tabs and subtabs
- `components/StatementView.tsx`: how a statement table looks
