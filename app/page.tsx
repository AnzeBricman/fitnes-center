import Link from "next/link";
import { getAdminOverviewForLanding } from "@/lib/dashboard-data";

export default async function HomePage() {
  const overview = await getAdminOverviewForLanding();

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="brand-kicker">Fitnes Center</span>
          <h1>Minimalisticna platforma za sodobno upravljanje fitnes centra.</h1>
          <p>
            Sistem zdruzuje clane, trenerje, urnike, narocnine, Stripe placila,
            analitiko, email obvestila, PDF dokumente, uvoz podatkov in knjiznico
            vaj.
          </p>
          <div className="landing-actions">
            <Link href="/admin" className="primary-button">
              Vstop v admin panel
            </Link>
            <Link href="/admin/subscriptions" className="ghost-link">
              Narocnine in placila
            </Link>
          </div>
        </div>

        <article className="landing-showcase">
          <span className="section-kicker">Pregled</span>
          <div className="landing-feature-grid">
            <div className="landing-feature-card">
              <strong>{overview.plans}</strong>
              <p>aktivnih planov v ponudbi</p>
            </div>
            <div className="landing-feature-card">
              <strong>{overview.paymentsPending}</strong>
              <p>odprtih placil v sistemu</p>
            </div>
            <div className="landing-feature-card">
              <strong>{overview.emailsSent}</strong>
              <p>zabelezenih email obvestil</p>
            </div>
            <div className="landing-feature-card">
              <strong>{overview.documentsCount}</strong>
              <p>pripravljenih dokumentov in racunov</p>
            </div>
          </div>
        </article>
      </section>

      <section className="landing-sections">
        <article className="panel-card">
          <span className="section-kicker">Kaj zna aplikacija</span>
          <h3>Vsebinsko pokriva cilje iz README.</h3>
          <ul className="stack-list">
            <li>CRUD za clane, trenerje, treninge in narocnine.</li>
            <li>Stripe checkout za placila narocnin.</li>
            <li>Uvoz CSV ali Excel podatkov, email opomniki in PDF izvozi.</li>
            <li>Analitika obiska po urah in rast baze clanov.</li>
            <li>Knjiznica vaj z moznostjo sinhronizacije iz zunanjega API.</li>
          </ul>
        </article>

        <article className="panel-card">
          <span className="section-kicker">Dostop</span>
          <h3>Javna predstavitev in ločen admin panel.</h3>
          <p className="empty-state">
            Javna predstavitev je na <strong>/</strong>, upravljanje pa na{" "}
            <strong>/admin</strong>.
          </p>
        </article>
      </section>
    </main>
  );
}
