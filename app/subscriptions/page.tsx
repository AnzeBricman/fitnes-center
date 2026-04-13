import { DashboardShell } from "@/components/dashboard-shell";
import { subscriptions } from "@/lib/mock-data";

export default function SubscriptionsPage() {
  return (
    <DashboardShell
      title="Narocnine"
      description="Pregled paketov, cen in aktivnih clanstev po planih."
    >
      <section className="panel-grid subscriptions-grid">
        {subscriptions.map((subscription) => (
          <article key={subscription.plan} className="metric-card">
            <span>{subscription.plan}</span>
            <strong>{subscription.price}</strong>
            <p>{subscription.duration}</p>
            <small>{subscription.members}</small>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}
