import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatDateTime, formatLabel } from "@/lib/utils";

export default async function AdminPage() {
  const { stats, upcomingWorkouts, recentMembers, popularPlans, recentPayments } =
    await getDashboardData();

  return (
    <DashboardShell
      title="Dashboard"
      description="Pregled poslovanja, placil, urnika in clanstva na podlagi realnih podatkov."
    >
      <section className="hero-banner">
        <div>
          <span className="section-kicker">Gym OS</span>
          <h3>Enoten pogled na poslovanje fitnes centra.</h3>
        </div>
        <p>
          Admin panel zdaj pokriva placila, analytics, dokumente, emaile, uvoze
          in katalog vaj poleg osnovnega upravljanja.
        </p>
      </section>

      <section className="panel-grid">
        {stats.map((item) => (
          <article key={item.label} className="metric-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Urnik</span>
              <h3>Prihodnji treningi</h3>
            </div>
          </div>
          <div className="table-list">
            {upcomingWorkouts.map((workout) => (
              <div key={workout.id} className="table-row">
                <div>
                  <strong>{workout.title}</strong>
                  <span>
                    {workout.trainer.fullName} · {formatDateTime(workout.scheduledAt)}
                  </span>
                </div>
                <div className="table-row-meta">
                  <strong>{workout._count.attendances}/{workout.capacity}</strong>
                  <span>{formatLabel(workout.level)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Placila</span>
              <h3>Najnovejsa placila</h3>
            </div>
          </div>
          <div className="table-list">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="table-row">
                <div>
                  <strong>{payment.member.fullName}</strong>
                  <span>{payment.description ?? "Narocnina"}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatCurrency(payment.amountCents)}</strong>
                  <span>{formatLabel(payment.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Clani</span>
              <h3>Najnovejsi vpisi</h3>
            </div>
          </div>
          <div className="table-list">
            {recentMembers.map((member) => (
              <div key={member.id} className="table-row">
                <div>
                  <strong>{member.fullName}</strong>
                  <span>{member.email}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{member.subscriptions[0]?.plan.name ?? "Brez paketa"}</strong>
                  <span>{formatDate(member.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Plan</span>
              <h3>Najbolj uporabljene narocnine</h3>
            </div>
          </div>
          <div className="plan-grid">
            {popularPlans.map((plan) => (
              <article key={plan.id} className="plan-card">
                <span>{plan.name}</span>
                <strong>{formatCurrency(plan.priceCents)}</strong>
                <p>{plan.durationDays} dni</p>
                <small>{plan._count.subscriptions} aktivacij</small>
              </article>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
