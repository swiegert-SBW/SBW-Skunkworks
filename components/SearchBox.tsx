"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({ variant = "pill" }: { variant?: "pill" | "large" }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  return (
    <form
      className={`search ${variant}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const t = value.trim().toUpperCase();
        if (t) router.push(`/company/${encodeURIComponent(t)}`);
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" />
      </svg>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search a ticker, e.g. AAPL" aria-label="Ticker symbol" />
      <button type="submit" className={variant === "pill" ? "sr-only" : ""}>Open</button>
    </form>
  );
}
