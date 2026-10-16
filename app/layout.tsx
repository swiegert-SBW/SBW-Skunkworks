import "./globals.css";
import { Suspense, type ReactNode } from "react";
import TopBar from "@/components/TopBar";
import MarketStrip from "@/components/MarketStrip";

export const metadata = { title: "SBW Workstation", description: "Company research workstation powered by SEC filings" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="workstation-sticky-header">
          <TopBar />
          <Suspense fallback={<div className="strip" />}>
            <MarketStrip />
          </Suspense>
        </div>
        {children}
      </body>
    </html>
  );
}
