import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatDateTime, formatLabel } from "@/lib/utils";

export default async function AdminPage() {
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
  } = await getDashboardData();

  const maxAttendance = Math.max(...attendanceTrend.map((item) => item.count), 1);
  const maxRevenue = Math.max(...revenueTrend.map((item) => item.amountCents), 1);

  return (
    <DashboardShell
      title="Command Center"
      description="Pregled poslovanja, clanstva, komunikacije in avtomatizacije na enem mestu."
    >
      <section className="command-center">
        <article className="command-center-hero">
          <div>
            <span className="section-kicker">Gym OS</span>
            <h3>Operativni pregled fitnes centra v realnem casu.</h3>
            <p>
              Admin panel zdaj deluje kot dejanska delovna konzola: spremljanje
              clanstva, placil, prisotnosti, email kampanj, uvozov in dokumentov
              brez skakanja med razlicnimi orodji.
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

        <article className="command-center-side">
          <span className="section-kicker">Admin fokus</span>
          <div className="insight-stack">
            <div>
              <strong>Filtriranje in sortiranje</strong>
              <p>Clani, placila, prisotnost in narocnine so pripravljeni za hiter pregled.</p>
            </div>
            <div>
              <strong>CSV / Excel uvoz</strong>
              <p>Masovni uvoz podatkov v bazo ostaja dostopen neposredno iz admin panela.</p>
            </div>
            <div>
              <strong>Email + PDF + API</strong>
              <p>Komunikacija, dokumenti in zunanji podatki so povezani v isti tok dela.</p>
            </div>
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
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Prisotnost</span>
              <h3>Trend zadnjih 7 dni</h3>
            </div>
          </div>
          <div className="spark-grid">
            {attendanceTrend.map((item) => (
              <div key={item.date} className="spark-column">
                <div className="spark-bar">
                  <i style={{ height: `${(item.count / maxAttendance) * 100}%` }} />
                </div>
                <strong>{item.count}</strong>
                <span>{formatDate(item.date)}</span>
              </div>
            ))}
          </div>
          <p className="support-note">Podatek sluzi za hitro zaznavanje padca obiska in planiranje urnika.</p>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Prihodki</span>
              <h3>Tedenski denarni tok</h3>
            </div>
          </div>
          <div className="spark-grid">
            {revenueTrend.map((item) => (
              <div key={item.week} className="spark-column">
                <div className="spark-bar spark-bar-revenue">
                  <i style={{ height: `${(item.amountCents / maxRevenue) * 100}%` }} />
                </div>
                <strong>{formatCurrency(item.amountCents)}</strong>
                <span>{formatDate(item.week)}</span>
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
              <h3>Automatizacija in zaledje</h3>
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

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Kaj panel podpira</span>
              <h3>Funkcionalnosti za dejansko uporabo</h3>
            </div>
          </div>
          <div className="capability-grid">
            <article className="capability-card">
              <strong>Filtriranje in sortiranje</strong>
              <p>Hitro razvrscanje clanov, placil, prisotnosti in aktivnih paketov.</p>
            </article>
            <article className="capability-card">
              <strong>CSV / Excel uvoz</strong>
              <p>Masovni uvoz v bazo za clane, pakete ali operativne sezname.</p>
            </article>
            <article className="capability-card">
              <strong>Email iz admina</strong>
              <p>Obvestila strankam, opomniki in kampanje neposredno iz sistema.</p>
            </article>
            <article className="capability-card">
              <strong>Avtomatski emaili</strong>
              <p>Dogodki, kot so nakupi, poteki ali potrditve, lahko sprozijo komunikacijo.</p>
            </article>
            <article className="capability-card">
              <strong>PDF izvoz</strong>
              <p>Racuni, potrdila in porocila ostanejo centralno zbrani in pripravljeni za izvoz.</p>
            </article>
            <article className="capability-card">
              <strong>Zunanji API podatki</strong>
              <p>Katalog vaj je obogaten z zunanjimi podatki za bolj bogato uporabnisko izkusnjo.</p>
            </article>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
