import Link from "next/link";
import { getAdminOverviewForLanding } from "@/lib/dashboard-data";

export default async function HomePage() {
  let overview = {
    plans: 0,
    paymentsPending: 0,
    emailsSent: 0,
    documentsCount: 0,
  };

  try {
    overview = await getAdminOverviewForLanding();
  } catch {
    // Landing page stays usable even when the database is temporarily unreachable.
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="brand-kicker">Fitnes Center</span>
          <h1>Operativna aplikacija za vodenje clanov, trenerjev in narocnin.</h1>
          <p>
            Vstopna stran je zdaj namenjena hitremu dostopu v sistem, ne javni predstavitvi.
            Od tukaj uporabnik nadaljuje v prijavo, registracijo ali neposredno v administratorski delovni pogled.
          </p>
          <div className="landing-actions">
            <Link href="/login" className="primary-button">
              Prijava v aplikacijo
            </Link>
            <Link href="/register" className="ghost-link">
              Ustvari racun
            </Link>
          </div>
        </div>

        <article className="landing-showcase">
          <span className="section-kicker">Stanje sistema</span>
          <div className="landing-feature-grid">
            <div className="landing-feature-card">
              <strong>{overview.plans}</strong>
              <p>aktivnih paketov</p>
            </div>
            <div className="landing-feature-card">
              <strong>{overview.paymentsPending}</strong>
              <p>odprtih placil</p>
            </div>
            <div className="landing-feature-card">
              <strong>{overview.emailsSent}</strong>
              <p>poslanih obvestil</p>
            </div>
            <div className="landing-feature-card">
              <strong>{overview.documentsCount}</strong>
              <p>ustvarjenih dokumentov</p>
            </div>
          </div>
        </article>
      </section>

      <section className="landing-sections">
        <article className="panel-card">
          <span className="section-kicker">Hiter dostop</span>
          <h3>Kam naprej?</h3>
          <ul className="stack-list">
            <li>Clan: prijava ali registracija in nato pregled narocnine v `/account`.</li>
            <li>Administrator: prijava in upravljanje v `/admin`.</li>
            <li>Obstojeci stari URL-ji se samodejno preusmerijo na ustrezne admin module.</li>
          </ul>
        </article>

        <article className="panel-card">
          <span className="section-kicker">Delovni moduli</span>
          <h3>Jedro sistema</h3>
          <p className="empty-state">
            Sistem pokriva clane, trenerje, treninge, narocnine, prisotnost, analitiko,
            uvoz, email obvestila in dokumente.
          </p>
          <p className="support-note">
            Ce baza trenutno ni dosegljiva, se prijava vseeno odpre, podatki na tej strani pa se prikazejo,
            ko je povezava ponovno vzpostavljena.
          </p>
        </article>
      </section>
    </main>
  );
}
