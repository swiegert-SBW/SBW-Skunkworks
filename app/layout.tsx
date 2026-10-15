import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "FinSight", description: "Company research platform powered by SEC filings" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
