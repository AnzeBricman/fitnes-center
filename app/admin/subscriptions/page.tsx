import Link from "next/link";
import { createPlan, createStripeCheckout } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSubscriptionsPageData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatLabel } from "@/lib/utils";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    sort?: string;
    status?: string;
    search?: string;
    paymentStatus?: string;
    provider?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const { plans, subscriptions, payments } = await getSubscriptionsPageData(params);

  return (
    <DashboardShell
      title="Narocnine"
      description="Pregled paketov, narocnin in placil z naprednim filtriranjem za admin ekipo."
    >
      <section className="dashboard-grid">
        <article className="panel-card form-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Paketi</span>
              <h3>Dodaj nov paket</h3>
            </div>
          </div>
          <form action={createPlan} className="admin-form">
            <label><span>Naziv</span><input name="name" required /></label>
            <label><span>Cena (EUR)</span><input type="number" name="price" step="0.01" required /></label>
            <label><span>Trajanje (dni)</span><input type="number" name="durationDays" required /></label>
            <label className="form-span-2"><span>Opis</span><textarea name="description" rows={3} /></label>
            <button className="primary-button" type="submit">Shrani paket</button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Aktivni paketi</span>
              <h3>Ponudba narocnin</h3>
            </div>
          </div>
          <div className="plan-grid">
            {plans.map((plan) => (
              <article key={plan.id} className="plan-card plan-card-modern">
                <span>{plan.name}</span>
                <strong>{formatCurrency(plan.priceCents)}</strong>
                <p>{plan.description ?? "Paket za fitnes clane."}</p>
                <small>{plan.durationDays} dni · {plan._count.subscriptions} aktivacij</small>
                <Link className="ghost-link" href={`/admin/subscriptions/${plan.id}/edit`}>
                  Uredi paket
                </Link>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Napredni filter</span>
            <h3>Narocnine in placila</h3>
          </div>
        </div>
        <form method="get" className="filter-form subscriptions-filter-form">
          <input name="search" defaultValue={params.search || ""} placeholder="Clan, email, paket ..." />
          <select name="status" defaultValue={params.status || ""}>
            <option value="">Vsi statusi narocnin</option>
            <option value="expiring">Potece kmalu</option>
            <option value="cancelled">Preklicane</option>
            <option value="expired">Potekle</option>
            <option value="pending">V cakanju</option>
          </select>
          <select name="paymentStatus" defaultValue={params.paymentStatus || ""}>
            <option value="">Vsi statusi placil</option>
            <option value="PAID">Placano</option>
            <option value="PENDING">V cakanju</option>
            <option value="FAILED">Neuspesno</option>
            <option value="REFUNDED">Vrnjeno</option>
          </select>
          <select name="provider" defaultValue={params.provider || ""}>
            <option value="">Vsi ponudniki</option>
            <option value="STRIPE">Stripe</option>
            <option value="MANUAL">Rocno</option>
          </select>
          <select name="sort" defaultValue={params.sort || "endDate"}>
            <option value="endDate">Konec narocnine</option>
            <option value="price">Cena</option>
            <option value="member">Clan</option>
            <option value="payment">Placila</option>
          </select>
          <button className="ghost-link" type="submit">Filtriraj</button>
        </form>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Narocnine</span>
              <h3>Aktivne in zgodovinske narocnine</h3>
            </div>
          </div>
          <div className="table-list">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="table-row table-row-actions">
                <div>
                  <strong>{subscription.member.fullName}</strong>
                  <span>{subscription.plan.name} · do {formatDate(subscription.endDate)}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatCurrency(subscription.plan.priceCents)}</strong>
                  <span>{formatLabel(subscription.status)}</span>
                </div>
                <div className="action-row">
                  <Link className="ghost-link" href={`/admin/members/${subscription.memberId}`}>Clan</Link>
                  <form action={createStripeCheckout}>
                    <input type="hidden" name="subscriptionId" value={subscription.id} />
                    <button className="ghost-link" type="submit">Stripe checkout</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Placila</span>
              <h3>Zadnja placila</h3>
            </div>
          </div>
          <div className="table-list">
            {payments.map((payment) => (
              <div key={payment.id} className="table-row">
                <div>
                  <strong>{payment.member.fullName}</strong>
                  <span>{payment.description ?? payment.subscription?.plan.name ?? "Narocnina"}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatCurrency(payment.amountCents)}</strong>
                  <span>{formatLabel(payment.provider)} · {formatLabel(payment.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
