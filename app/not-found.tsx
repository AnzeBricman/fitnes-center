import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-shell">
      <section className="dashboard-content" style={{ gridColumn: "1 / -1" }}>
        <article className="hero-banner">
          <div>
            <span className="section-kicker">404</span>
            <h3>Stran ne obstaja.</h3>
          </div>
          <div className="topbar-actions">
            <p>Vrni se v aplikacijo in nadaljuj z delom.</p>
            <Link href="/login" className="ghost-link">
              Pojdi na prijavo
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
