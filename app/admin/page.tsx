import { DashboardShell } from "@/components/dashboard-shell";
import { getAnalyticsPeriod, getPeriodLabel } from "@/lib/analytics-period";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatDateTime, formatLabel } from "@/lib/utils";

const periods = ["day", "week", "month", "year"] as const;

function formatTrendLabel(value: string) {
  if (value.includes(":")) return value;
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  return formatDate(value);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedPeriod = getAnalyticsPeriod(params.period);
  const {
    stats,
    upcomingWorkouts,
    recentMembers,
    popularPlans,
    recentPayments,
    memberStatus,
    paymentStatus,
    operations,
    attendanceTrend,
    revenueTrend,
  } = await getDashboardData({ period: selectedPeriod });

  const maxAttendance = Math.max(...attendanceTrend.map((item) => item.count), 1);
  const maxRevenue = Math.max(...revenueTrend.map((item) => item.amountCents), 1);

  return (
    <DashboardShell
      title="Command Center"
      description="Pregled poslovanja, clanstva in prihodkov z uporabnimi podatki za izbrano obdobje."
    >
      <section className="panel-card dashboard-toolbar">
        <div>
          <span className="section-kicker">Pregled obdobja</span>
          <h3>Filtriraj admin pogled po casu</h3>
          <p className="support-copy">
            Trenutno gledas podatke za obdobje: <strong>{getPeriodLabel(selectedPeriod)}</strong>.
          </p>
        </div>

        <form method="get" className="period-filter">
          {periods.map((period) => (
            <button
              key={period}
              type="submit"
              name="period"
              value={period}
              className={`period-chip${selectedPeriod === period ? " period-chip-active" : ""}`}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </form>
      </section>

      <section className="command-center command-center-single">
        <article className="command-center-hero">
          <div>
            <span className="section-kicker">Gym OS</span>
            <h3>Operativni pregled fitnes centra v realnem casu.</h3>
            <p>
              Admin panel zdaj daje poudarek dejanskim stevilkam: clanstvo,
              prihodki, prisotnost, placila in paketi v obdobju, ki ga izberes.
            </p>
          </div>

          <div className="command-pill-row">
            {memberStatus.map((item) => (
              <article key={item.label} className={`status-pill status-pill-${item.tone}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        {stats.map((item) => (
          <article key={item.label} className="metric-card metric-card-modern">
            <span className="metric-label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel-card chart-surface-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Prisotnost</span>
              <h3>Trend za izbrano obdobje</h3>
            </div>
          </div>
          <div className="spark-grid spark-grid-wide">
            {attendanceTrend.map((item) => (
              <div key={item.date} className="spark-column spark-column-modern">
                <div className="spark-bar spark-bar-soft">
                  <i style={{ height: `${(item.count / maxAttendance) * 100}%` }} />
                </div>
                <strong>{item.count}</strong>
                <span>{formatTrendLabel(item.date)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card chart-surface-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Prihodki</span>
              <h3>Denarni tok po obdobju</h3>
            </div>
          </div>
          <div className="spark-grid spark-grid-wide">
            {revenueTrend.map((item) => (
              <div key={item.week} className="spark-column spark-column-modern">
                <div className="spark-bar spark-bar-revenue spark-bar-soft">
                  <i style={{ height: `${(item.amountCents / maxRevenue) * 100}%` }} />
                </div>
                <strong>{formatCurrency(item.amountCents)}</strong>
                <span>{formatTrendLabel(item.week)}</span>
              </div>
            ))}
          </div>
          <div className="status-card-grid compact-status-grid">
            {paymentStatus.map((item) => (
              <article key={item.label} className={`status-card status-card-${item.tone}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </article>
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
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Produkti</span>
              <h3>Najbolj uporabljene narocnine</h3>
            </div>
          </div>
          <div className="plan-grid">
            {popularPlans.map((plan) => (
              <article key={plan.id} className="plan-card plan-card-modern">
                <span>{plan.name}</span>
                <strong>{formatCurrency(plan.priceCents)}</strong>
                <p>{plan.durationDays} dni</p>
                <small>{plan._count.subscriptions} aktivacij</small>
              </article>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Operacije</span>
              <h3>Sistem v uporabi</h3>
            </div>
          </div>
          <div className="status-card-grid">
            {operations.map((item) => (
              <article key={item.label} className="status-card status-card-neutral">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card panel-card-wide">
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
    </DashboardShell>
  );
}
