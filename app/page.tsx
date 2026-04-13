import { DashboardShell } from "@/components/dashboard-shell";
import { alerts, dashboardStats, members, workouts } from "@/lib/mock-data";

export default function Home() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Pregled fitnes centra z osnovnimi KPI, opozorili in dnevnim urnikom."
    >
      <section className="panel-grid">
        {dashboardStats.map((item) => (
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
              <span className="section-kicker">Operativa</span>
              <h3>Pomembna opozorila</h3>
            </div>
          </div>

          <ul className="stack-list">
            {alerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Danes</span>
              <h3>Prihodnji treningi</h3>
            </div>
          </div>

          <div className="table-list">
            {workouts.map((workout) => (
              <div key={workout.title} className="table-row">
                <div>
                  <strong>{workout.title}</strong>
                  <span>{workout.coach}</span>
                </div>
                <div>
                  <strong>{workout.time}</strong>
                  <span>{workout.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Clani</span>
            <h3>Zadnje stanje clanstva</h3>
          </div>
        </div>

        <div className="table-list">
          {members.map((member) => (
            <div key={member.name} className="table-row">
              <div>
                <strong>{member.name}</strong>
                <span>{member.plan}</span>
              </div>
              <div>
                <strong>{member.status}</strong>
                <span>{member.nextPayment}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
