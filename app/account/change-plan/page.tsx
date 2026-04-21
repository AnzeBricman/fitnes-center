import { changeMyPlan } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFeatures, getPlanHighlight } from "@/lib/plans";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function ChangePlanPage() {
  const user = await requireUser();
  const memberId = user.memberId;

  const [plans, currentSubscription] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { priceCents: "asc" } }),
    memberId
      ? prisma.subscription.findFirst({
          where: { memberId, active: true },
          include: { plan: true },
          orderBy: { endDate: "desc" },
        })
      : Promise.resolve(null),
  ]);

  return (
    <main className="landing-shell">
      <section className="panel-card form-card register-panel">
        <span className="section-kicker">Sprememba narocnine</span>
        <h2>Izberi paket, ki ti najbolj ustreza.</h2>
        <p className="register-intro">
          Odpre se samostojna stran z vsemi moznimi paketi, da uporabnik jasno vidi
          razliko med ponudbami in brez zmede izbere nov plan.
        </p>

        {currentSubscription ? (
          <p className="support-note">
            Trenutno uporabljas paket <strong>{currentSubscription.plan.name}</strong>.
          </p>
        ) : null}

        <form className="admin-form register-form" action={changeMyPlan}>
          <div className="form-span-2 pricing-card-grid">
            {plans.map((plan, index) => {
              const features = getPlanFeatures(plan.name, plan.description, plan.durationDays);
              const isFeatured = index === 1;
              const isCurrent = currentSubscription?.planId === plan.id;

              return (
                <label
                  key={plan.id}
                  className={`pricing-card${isFeatured ? " pricing-card-featured" : ""}${isCurrent ? " pricing-card-current" : ""}`}
                >
                  <input
                    type="radio"
                    name="planId"
                    value={plan.id}
                    defaultChecked={isCurrent || (!currentSubscription && index === 1)}
                    required
                  />

                  <div className="pricing-card-top">
                    <div>
                      <span className="pricing-card-name">{plan.name}</span>
                      <strong>{formatCurrency(plan.priceCents)}</strong>
                    </div>
                    <span className="pricing-chip">{getPlanHighlight(plan.name, index)}</span>
                  </div>

                  <div className="pricing-selected-badge">
                    {isCurrent ? "Trenutni paket" : "Izbran paket"}
                  </div>

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

          <button className="primary-button" type="submit">Potrdi spremembo</button>
        </form>

        <div className="landing-actions">
          <Link href="/account" className="ghost-link">Nazaj na racun</Link>
        </div>
      </section>
    </main>
  );
}
