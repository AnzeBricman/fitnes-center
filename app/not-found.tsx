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
            <p>Vrni se na dashboard in nadaljuj z upravljanjem fitnes centra.</p>
            <Link href="/" className="ghost-link">
              Nazaj na zacetek
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
