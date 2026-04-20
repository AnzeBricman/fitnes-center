import { extendSubscription, markPaymentPaid, updateSubscriptionStatus } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getActiveSubscriptionsPageData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatLabel } from "@/lib/utils";

export default async function ActiveSubscriptionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { subscriptions } = await getActiveSubscriptionsPageData(params);

  return (
    <DashboardShell
      title="Aktivne narocnine"
      description="Pregled vseh aktivnih, poteklih in cakajocih clanarine."
    >
      <section className="panel-card">
        <div className="panel-card-header">
          <div><span className="section-kicker">Status</span><h3>Filtri</h3></div>
          <form method="get" className="filter-form inline-filter-form">
            <select name="status" defaultValue={params.status || "active"}>
              <option value="active">Aktivne</option>
              <option value="expiring">Potece kmalu</option>
              <option value="expired">Potekle</option>
              <option value="pending">V cakanju</option>
            </select>
            <button className="ghost-link" type="submit">Filtriraj</button>
          </form>
        </div>
        <div className="table-list">
          {subscriptions.map((subscription: any) => {
            const payment = subscription.payment;
            return (
              <div key={subscription.id} className="table-row">
                <div>
                  <strong>{subscription.member.fullName}</strong>
                  <span>{subscription.plan.name} - do {formatDate(subscription.endDate)}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatCurrency(subscription.plan.priceCents)}</strong>
                  <span>{formatLabel(subscription.status)}</span>
                </div>
                <div className="action-row">
                  <form action={updateSubscriptionStatus}>
                    <input type="hidden" name="id" value={subscription.id} />
                    <input type="hidden" name="status" value="CANCELLED" />
                    <button className="ghost-link" type="submit">Preklici</button>
                  </form>
                  <form action={extendSubscription}>
                    <input type="hidden" name="id" value={subscription.id} />
                    <input type="hidden" name="days" value="30" />
                    <button className="ghost-link" type="submit">Podaljsaj</button>
                  </form>
                  {payment ? (
                    <form action={markPaymentPaid}>
                      <input type="hidden" name="id" value={payment.id} />
                      <button className="ghost-link" type="submit">Oznaci placano</button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}

