import { prisma } from "@/lib/prisma";
import { getPlanFeatures, getPlanHighlight } from "@/lib/plans";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; plan?: string; payment?: string }>;
}) {
  const params = (await searchParams) ?? {};
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
      <section className="panel-card form-card register-panel">
        <span className="section-kicker">Registracija</span>
        <h2>Izberi paket in ustvari uporabniski racun.</h2>
        <p className="register-intro">
          Paketi so prikazani kot kartice, da uporabnik takoj vidi ceno, trajanje in
          kaj dejansko dobi z izbrano narocnino.
        </p>

        {params.error ? (
          <p className="empty-state">
            {params.error === "exists"
              ? "Uporabnik ze obstaja."
              : params.error === "missing"
                ? "Izpolni vsa polja."
                : params.error === "password"
                  ? "Geslo mora imeti vsaj 8 znakov."
                : params.error === "plan"
                  ? "Izberi veljaven paket."
                  : params.error === "stripe"
                    ? "Stripe placilo trenutno ni na voljo. Preveri nastavitve in poskusi znova."
                    : ""}
          </p>
        ) : null}

        {params.payment ? (
          <p className="empty-state">
            {params.payment === "cancelled"
              ? "Placilo je bilo preklicano. Za aktivacijo racuna mora biti paket placan."
              : params.payment === "failed"
                ? "Placila ni bilo mogoce potrditi. Poskusi ponovno ali izberi drug paket."
                : ""}
          </p>
        ) : null}

        {plansLoadFailed ? (
          <p className="empty-state">Registracija trenutno ni na voljo, ker povezava z bazo ni uspela.</p>
        ) : plans.length === 0 ? (
          <p className="empty-state">Registracija trenutno ni mozna, ker ni nastavljenega nobenega aktivnega paketa.</p>
        ) : (
          <form className="admin-form register-form" action="/auth/register" method="post">
            <div className="form-span-2 pricing-card-grid">
              {plans.map((plan, index) => {
                const features = getPlanFeatures(plan.name, plan.description, plan.durationDays);
                const isFeatured = index === 1;
                const isSelected = params.plan ? params.plan === plan.id : index === 1;

                return (
                  <label
                    key={plan.id}
                    className={`pricing-card${isFeatured ? " pricing-card-featured" : ""}`}
                  >
                    <input
                      type="radio"
                      name="planId"
                      value={plan.id}
                      defaultChecked={isSelected}
                      required
                    />
                    <div className="pricing-card-top">
                      <div>
                        <span className="pricing-card-name">{plan.name}</span>
                        <strong>{formatCurrency(plan.priceCents)}</strong>
                      </div>
                      <span className="pricing-chip">
                        {getPlanHighlight(plan.name, index)}
                      </span>
                    </div>

                    <div className="pricing-selected-badge">Izbran paket</div>

                    <p className="pricing-card-description">
                      {plan.description ?? "Paket za clane, ki zelijo reden in pregleden napredek."}
                    </p>

                    <ul className="pricing-feature-list">
                      {features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </label>
                );
              })}
            </div>

            <label>
              <span>Ime in priimek</span>
              <input name="fullName" required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" required />
            </label>
            <label className="form-span-2">
              <span>Geslo</span>
              <input name="password" type="password" required />
            </label>

            <button className="primary-button" type="submit">Registriraj se</button>
          </form>
        )}

        <div className="landing-actions">
          <Link href="/login" className="ghost-link">Ze imam racun</Link>
          <Link href="/" className="ghost-link">Nazaj na zacetek</Link>
        </div>
      </section>
    </main>
  );
}
