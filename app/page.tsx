import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPlanFeatures, getPlanHighlight } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let plans: Awaited<ReturnType<typeof prisma.subscriptionPlan.findMany>> = [];
  let plansLoadFailed = false;

  try {
    plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceCents: "asc" },
    });
  } catch {
    plansLoadFailed = true;
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="brand-kicker">Fitnes Center</span>
          <h1>Treniraj pametneje z jasnim planom in rezervacijami.</h1>
          <p>
            Izberi paket, ustvari racun in si v clanski aplikaciji rezerviraj skupinske treninge,
            preglej trenerje ter spremljaj svojo narocnino na enem mestu.
          </p>
          <div className="landing-actions">
            <Link href="#paketi" className="primary-button">
              Poglej pakete
            </Link>
            <Link href="/login" className="ghost-link">
              Prijava za clane
            </Link>
          </div>
        </div>

        <article className="landing-showcase">
          <span className="section-kicker">Kaj dobis</span>
          <div className="landing-feature-grid">
            <div className="landing-feature-card">
              <strong>Rezervacije</strong>
              <p>Skupinski termini glede na pravice izbranega paketa.</p>
            </div>
            <div className="landing-feature-card">
              <strong>Trenerji</strong>
              <p>Pregled aktivnih trenerjev, specializacij in prihodnjih terminov.</p>
            </div>
            <div className="landing-feature-card">
              <strong>Osebni termini</strong>
              <p>Pri boljsih paketih rezerviras trenerja, ce je v izbranem casu prost.</p>
            </div>
            <div className="landing-feature-card">
              <strong>Moj racun</strong>
              <p>Pregled paketa, rezervacij, obiskov in menjave narocnine.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="landing-sections">
        <article className="panel-card">
          <span className="section-kicker">Fitnes</span>
          <h3>Vse za reden trening</h3>
          <p className="empty-state">
            Fitnes center je zasnovan za clane, ki zelijo preprost dostop do vadbe,
            jasen urnik in hitro rezervacijo terminov brez klicanja ali cakanja na recepciji.
          </p>
        </article>

        <article className="panel-card">
          <span className="section-kicker">Nakup paketa</span>
          <h3>Racun ustvaris z izbranim paketom</h3>
          <p className="empty-state">
            Za uporabo aplikacije najprej izberes paket. Sele nato ustvaris uporabniski racun,
            aplikacija pa ti odpre pravice, ki pripadajo tvoji narocnini.
          </p>
        </article>
      </section>

      <section id="paketi" className="panel-card landing-pricing-section">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Paketi</span>
            <h3>Izberi narocnino</h3>
          </div>
          <Link href="/login" className="ghost-link">Ze imam racun</Link>
        </div>

        {plansLoadFailed ? (
          <p className="empty-state">Paketov trenutno ni mogoce naloziti. Poskusi ponovno cez nekaj trenutkov.</p>
        ) : plans.length === 0 ? (
          <p className="empty-state">Trenutno ni nastavljenega nobenega aktivnega paketa.</p>
        ) : (
          <div className="pricing-card-grid landing-pricing-grid">
            {plans.map((plan, index) => {
              const features = getPlanFeatures(plan.name, plan.description, plan.durationDays);
              const isFeatured = index === 1;

              return (
                <article
                  key={plan.id}
                  className={`pricing-card${isFeatured ? " pricing-card-featured" : ""}`}
                >
                  <div className="pricing-card-top">
                    <div>
                      <span className="pricing-card-name">{plan.name}</span>
                      <strong>{formatCurrency(plan.priceCents)}</strong>
                    </div>
                    <span className="pricing-chip">{getPlanHighlight(plan.name, index)}</span>
                  </div>

                  <p className="pricing-card-description">
                    {plan.description ?? "Paket za clane, ki zelijo reden in pregleden napredek."}
                  </p>

                  <ul className="pricing-feature-list">
                    {features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  <Link href={`/register?plan=${plan.id}`} className="primary-button">
                    Izberi paket
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
