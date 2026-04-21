import { DashboardShell } from "@/components/dashboard-shell";
import { getAnalyticsPeriod, getPeriodLabel } from "@/lib/analytics-period";
import { getAnalyticsPageData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatLabel } from "@/lib/utils";

const periods = ["day", "week", "month", "year"] as const;

function formatTrendLabel(value: string) {
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  return formatDate(value);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedPeriod = getAnalyticsPeriod(params.period);
  const {
    visitByHour,
    memberGrowth,
    attendanceCount,
    subscriptionStatus,
    paymentProviders,
    revenueByMonth,
  } = await getAnalyticsPageData({ period: selectedPeriod });

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
      <section className="panel-card dashboard-toolbar">
        <div>
          <span className="section-kicker">Analitika</span>
          <h3>Primerjaj podatke po obdobjih</h3>
          <p className="support-copy">
            Aktivni filter: <strong>{getPeriodLabel(selectedPeriod)}</strong>
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

      <section className="dashboard-grid">
        <article className="panel-card chart-surface-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Obisk</span>
              <h3>Po urah dneva</h3>
            </div>
          </div>
          <div className="chart-list">
            {visitByHour.map((item) => (
              <div key={item.hour} className="chart-row chart-row-modern">
                <span>{item.hour.toString().padStart(2, "0")}:00</span>
                <div className="chart-bar chart-bar-modern">
                  <i style={{ width: `${(item.count / maxVisit) * 100}%` }} />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <p className="support-note">Skupno zabelezenih prihodov: {attendanceCount}</p>
        </article>

        <article className="panel-card chart-surface-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Rast</span>
              <h3>Novi clani skozi cas</h3>
            </div>
          </div>
          <div className="chart-list">
            {memberGrowth.map((item) => (
              <div key={item.date} className="chart-row chart-row-modern">
                <span>{formatTrendLabel(item.date)}</span>
                <div className="chart-bar chart-bar-growth">
                  <i style={{ width: `${(item.count / maxGrowth) * 100}%` }} />
                </div>
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
              <h3>Ponudniki placil</h3>
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
        <article className="panel-card panel-card-wide chart-surface-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Prihodki</span>
              <h3>Prihodki skozi izbrano obdobje</h3>
            </div>
          </div>
          <div className="spark-grid spark-grid-wide">
            {revenueByMonth.map((item) => (
              <div key={item.month} className="spark-column spark-column-modern">
                <div className="spark-bar spark-bar-revenue spark-bar-soft">
                  <i style={{ height: `${(item.amountCents / maxRevenue) * 100}%` }} />
                </div>
                <strong>{formatCurrency(item.amountCents)}</strong>
                <span>{formatTrendLabel(item.month)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
