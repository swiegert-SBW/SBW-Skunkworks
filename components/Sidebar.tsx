"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, href } from "@/lib/nav";

export default function Sidebar({ ticker }: { ticker: string }) {
  const parts = (usePathname() || "").split("/").filter(Boolean); // ["company", "AAPL", section?, sub?]
  const section = parts[2] ?? "overviews";
  const sub = parts[3] ?? "snapshot";
  return (
    <nav className="sidebar" aria-label="Company sections">
      {NAV.map((s) => {
        const open = s.id === section;
        return (
          <div key={s.id} className="nav-group">
            <Link href={href(ticker, s.id, s.items[0].id)} className={open ? "nav-section open" : "nav-section"}>
              {s.label}
              <span aria-hidden>{open ? "▾" : "▸"}</span>
            </Link>
            {open &&
              s.items.map((i) => (
                <Link key={i.id} href={href(ticker, s.id, i.id)} className={i.id === sub ? "nav-item active" : "nav-item"}>
                  {i.label}
                </Link>
              ))}
          </div>
        );
      })}
    </nav>
  );
}
