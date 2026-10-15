export default function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <div className="pagebar">{title}</div>
      <main className="coming-soon">
        <div className="coming-soon-mark" aria-hidden="true">✦</div>
        <h1>{title}</h1>
        <p className="muted">This tab is not built yet. The navigation is in place so it can be filled in one tab at a time.</p>
      </main>
    </>
  );
}
