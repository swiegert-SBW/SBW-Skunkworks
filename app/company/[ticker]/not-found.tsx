import SearchBox from "@/components/SearchBox";

export default function NotFound() {
  return (
    <main className="home">
      <h1>Ticker not found</h1>
      <p className="muted">The SEC has no company filed under that ticker. Check the spelling and try again.</p>
      <SearchBox variant="large" />
    </main>
  );
}
