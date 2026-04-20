import { extendSubscription, markPaymentPaid } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getUpcomingPaymentsData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatLabel } from "@/lib/utils";

export default async function UpcomingPaymentsPage() {
  const subscriptions = await getUpcomingPaymentsData();
  const now = new Date();

  return (
    <DashboardShell
      title="Prihajajoca placila"
      description="Pregled clanov, ki jim narocnina kmalu potece in zahtevajo placilo."
    >
      <section className="panel-card">
        <div className="panel-card-header">
          <div><span className="section-kicker">Poteki</span><h3>Narocnine v naslednjih 30 dneh</h3></div>
        </div>
        <div className="table-list">
          {subscriptions.map((subscription) => {
            const diffMs = subscription.endDate.getTime() - now.getTime();
            const daysLeft = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
            const payment = subscription.payments[0];

            return (
              <div key={subscription.id} className="table-row">
                <div>
                  <strong>{subscription.member.fullName}</strong>
                  <span>{subscription.plan.name} - do {formatDate(subscription.endDate)}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatCurrency(subscription.plan.priceCents)}</strong>
                  <span>{daysLeft} dni - {payment ? formatLabel(payment.status) : "Brez placila"}</span>
                </div>
                <div className="action-row">
                  {payment ? (
                    <form action={markPaymentPaid}>
                      <input type="hidden" name="id" value={payment.id} />
                      <button className="ghost-link" type="submit">Oznaci placano</button>
                    </form>
                  ) : null}
                  <form action={extendSubscription}>
                    <input type="hidden" name="id" value={subscription.id} />
                    <input type="hidden" name="days" value="30" />
                    <button className="ghost-link" type="submit">Podaljsaj</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}

