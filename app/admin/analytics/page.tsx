import { DashboardShell } from "@/components/dashboard-shell";
import { getAnalyticsPageData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatLabel } from "@/lib/utils";

export default async function AnalyticsPage() {
  const {
    visitByHour,
    memberGrowth,
    attendanceCount,
    subscriptionStatus,
    paymentProviders,
    revenueByMonth,
  } = await getAnalyticsPageData();

  const maxVisit = Math.max(...visitByHour.map((item) => item.count), 1);
  const maxGrowth = Math.max(...memberGrowth.map((item) => item.count), 1);
  const maxSubscription = Math.max(...subscriptionStatus.map((item) => item.count), 1);
  const maxProviderAmount = Math.max(...paymentProviders.map((item) => item.amountCents), 1);
  const maxRevenue = Math.max(...revenueByMonth.map((item) => item.amountCents), 1);

  return (
    <DashboardShell
      title="Analitika"
      description="Vizualizacija obiska, rasti, placilnih kanalov in prihodkov za hitre poslovne odlocitve."
    >
      <section className="command-center">
        <article className="command-center-hero analytics-hero">
          <div>
            <span className="section-kicker">Business intelligence</span>
            <h3>Podatki so pregledni, primerljivi in pripravljeni za odlocanje.</h3>
            <p>
              Ta pogled zdruzuje obisk po urah, rast baze clanov, prihodke po
              mesecih in razmerje med statusi narocnin ter placilnimi kanali.
            </p>
          </div>

          <div className="command-pill-row">
            <article className="status-pill status-pill-success">
              <span>Skupna prisotnost</span>
              <strong>{attendanceCount}</strong>
            </article>
            <article className="status-pill status-pill-warning">
              <span>Placilni kanali</span>
              <strong>{paymentProviders.length}</strong>
            </article>
            <article className="status-pill status-pill-muted">
              <span>Statusi narocnin</span>
              <strong>{subscriptionStatus.length}</strong>
            </article>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Obisk</span>
              <h3>Po urah dneva</h3>
            </div>
          </div>
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
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Rast</span>
              <h3>Stevilo novih clanov</h3>
            </div>
          </div>
          <div className="chart-list">
            {memberGrowth.slice(-8).map((item) => (
              <div key={item.date} className="chart-row">
                <span>{formatDate(item.date)}</span>
                <div className="chart-bar"><i style={{ width: `${(item.count / maxGrowth) * 100}%` }} /></div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Narocnine</span>
              <h3>Statusi narocnin</h3>
            </div>
          </div>
          <div className="status-distribution">
            {subscriptionStatus.map((item) => (
              <div key={item.status} className="distribution-row">
                <div className="distribution-copy">
                  <strong>{formatLabel(item.status)}</strong>
                  <span>{item.count} zapisov</span>
                </div>
                <div className="distribution-bar">
                  <i style={{ width: `${(item.count / maxSubscription) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Placila</span>
              <h3>Placilni ponudniki</h3>
            </div>
          </div>
          <div className="status-distribution">
            {paymentProviders.map((item) => (
              <div key={item.provider} className="distribution-row">
                <div className="distribution-copy">
                  <strong>{formatLabel(item.provider)}</strong>
                  <span>{item.count} transakcij</span>
                </div>
                <div className="distribution-bar distribution-bar-dark">
                  <i style={{ width: `${(item.amountCents / maxProviderAmount) * 100}%` }} />
                </div>
                <strong>{formatCurrency(item.amountCents)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card panel-card-wide">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Prihodki</span>
              <h3>Mescni prihodki</h3>
            </div>
          </div>
          <div className="spark-grid">
            {revenueByMonth.map((item) => (
              <div key={item.month} className="spark-column">
                <div className="spark-bar spark-bar-revenue">
                  <i style={{ height: `${(item.amountCents / maxRevenue) * 100}%` }} />
                </div>
                <strong>{formatCurrency(item.amountCents)}</strong>
                <span>{item.month}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
