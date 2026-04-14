import { createPlan, createStripeCheckout, createSubscription } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSubscriptionsPageData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatLabel } from "@/lib/utils";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; status?: string; stripe?: string; payment?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { plans, members, subscriptions, payments } = await getSubscriptionsPageData(params);
  const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <DashboardShell
      title="Narocnine"
      description="Paketi, aktivacije in Stripe checkout za placila narocnin."
    >
      <section className="content-layout">
        <div className="stack-column">
          <article className="panel-card form-card">
            <div className="panel-card-header"><div><span className="section-kicker">Plan</span><h3>Dodaj narocnino</h3></div></div>
            <form action={createPlan} className="admin-form">
              <label><span>Naziv</span><input name="name" required placeholder="Pro Unlimited" /></label>
              <label><span>Cena (EUR)</span><input type="number" name="price" defaultValue="59" step="0.01" required /></label>
              <label><span>Trajanje</span><input type="number" name="durationDays" defaultValue="30" required /></label>
              <label className="form-span-2"><span>Opis</span><textarea rows={3} name="description" placeholder="Opis ugodnosti paketa" /></label>
              <button className="primary-button" type="submit">Shrani plan</button>
            </form>
          </article>

          <article className="panel-card form-card">
            <div className="panel-card-header"><div><span className="section-kicker">Aktivacija</span><h3>Dodeli plan clanu</h3></div></div>
            <form action={createSubscription} className="admin-form">
              <label className="form-span-2">
                <span>Clan</span>
                <select name="memberId" required defaultValue="">
                  <option value="" disabled>Izberi clana brez aktivne narocnine</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
                </select>
              </label>
              <label>
                <span>Paket</span>
                <select name="planId" required defaultValue="">
                  <option value="" disabled>Izberi plan</option>
                  {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                </select>
              </label>
              <label><span>Zacetek</span><input type="date" name="startDate" required /></label>
              <button className="primary-button" type="submit">Aktiviraj narocnino</button>
            </form>
            {!stripeEnabled ? (
              <p className="support-note">Stripe checkout bo aktiven po dodatku `STRIPE_SECRET_KEY` in `NEXT_PUBLIC_APP_URL`.</p>
            ) : null}
          </article>
        </div>

        <div className="stack-column">
          <article className="panel-card">
            <div className="panel-card-header">
              <div><span className="section-kicker">Paketi</span><h3>Aktivni plani</h3></div>
              <form method="get" className="filter-form inline-filter-form">
                <select name="sort" defaultValue={params.sort || ""}>
                  <option value="">Po izteku</option>
                  <option value="price">Po ceni</option>
                  <option value="member">Po clanu</option>
                </select>
                <select name="status" defaultValue={params.status || ""}>
                  <option value="">Vsi</option>
                  <option value="expiring">Potece kmalu</option>
                </select>
                <button className="ghost-link" type="submit">Filtriraj</button>
              </form>
            </div>

            <div className="plan-grid">
              {plans.map((plan) => (
                <article key={plan.id} className="plan-card">
                  <span>{plan.name}</span>
                  <strong>{formatCurrency(plan.priceCents)}</strong>
                  <p>{plan.description}</p>
                  <small>{plan._count.subscriptions} aktivnih</small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-card-header"><div><span className="section-kicker">Placila</span><h3>Aktivne narocnine</h3></div></div>
            <div className="table-list">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="table-row table-row-actions">
                  <div>
                    <strong>{subscription.member.fullName}</strong>
                    <span>{subscription.plan.name} · do {formatDate(subscription.endDate)}</span>
                  </div>
                  <div className="table-row-meta">
                    <strong>{formatCurrency(subscription.plan.priceCents)}</strong>
                    <span>{subscription.payments[0] ? formatLabel(subscription.payments[0].status) : "Brez placila"}</span>
                  </div>
                  <form action={createStripeCheckout}>
                    <input type="hidden" name="subscriptionId" value={subscription.id} />
                    <button className="ghost-link" type="submit" disabled={!stripeEnabled}>Placaj</button>
                  </form>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-header"><div><span className="section-kicker">Zgodovina</span><h3>Zadnja placila</h3></div></div>
        <div className="table-list">
          {payments.map((payment) => (
            <div key={payment.id} className="table-row">
              <div>
                <strong>{payment.member.fullName}</strong>
                <span>{payment.subscription?.plan.name ?? "Rocno placilo"}</span>
              </div>
              <div className="table-row-meta">
                <strong>{formatCurrency(payment.amountCents)}</strong>
                <span>{formatLabel(payment.status)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
