import { DashboardShell } from "@/components/dashboard-shell";
import { getAnalyticsPageData } from "@/lib/dashboard-data";

export default async function AnalyticsPage() {
  const { visitByHour, memberGrowth, attendanceCount } = await getAnalyticsPageData();
  const maxVisit = Math.max(...visitByHour.map((item) => item.count), 1);
  const maxGrowth = Math.max(...memberGrowth.map((item) => item.count), 1);

  return (
    <DashboardShell
      title="Analitika"
      description="Vizualizacija obiska po urah in rast stevila clanov skozi cas."
    >
      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Obisk</span><h3>Po urah dneva</h3></div></div>
          <div className="chart-list">
            {visitByHour.map((item) => (
              <div key={item.hour} className="chart-row">
                <span>{item.hour.toString().padStart(2, "0")}:00</span>
                <div className="chart-bar"><i style={{ width: `${(item.count / maxVisit) * 100}%` }} /></div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <p className="support-note">Skupno zabelezenih prihodov: {attendanceCount}</p>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Rast</span><h3>Stevilo novih clanov</h3></div></div>
          <div className="chart-list">
            {memberGrowth.map((item) => (
              <div key={item.date} className="chart-row">
                <span>{item.date}</span>
                <div className="chart-bar"><i style={{ width: `${(item.count / maxGrowth) * 100}%` }} /></div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
