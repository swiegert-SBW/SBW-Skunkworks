"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({ large }: { large?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  return (
    <form
      className={large ? "search large" : "search"}
      onSubmit={(e) => {
        e.preventDefault();
        const t = value.trim().toUpperCase();
        if (t) router.push(`/company/${encodeURIComponent(t)}`);
      }}
    >
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter a ticker, e.g. AAPL" aria-label="Ticker symbol" />
      <button type="submit">Open</button>
    </form>
  );
}
