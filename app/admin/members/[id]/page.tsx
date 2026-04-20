import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getMemberProfileData } from "@/lib/dashboard-data";
import { formatCurrency, formatDate, formatDateTime, formatLabel } from "@/lib/utils";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberProfileData(id);

  if (!member) {
    notFound();
  }

  const activeSubscription =
    member.subscriptions.find((subscription) => subscription.active) ?? member.subscriptions[0];

  return (
    <DashboardShell
      title={member.fullName}
      description="Profil clana z narocninami in prisotnostjo."
      actions={
        <div className="header-actions">
          <Link className="ghost-link" href={`/admin/members/${member.id}/edit`}>Uredi clana</Link>
          <Link className="ghost-link" href="/admin/subscriptions">Dodaj narocnino</Link>
          <Link className="ghost-link" href="/admin/emails">Poslji email</Link>
        </div>
      }
    >
      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Podatki</span><h3>Osnovno</h3></div></div>
          <div className="detail-list">
            <div><span>Email</span><strong>{member.email}</strong></div>
            <div><span>Telefon</span><strong>{member.phone ?? "-"}</strong></div>
            <div><span>Status</span><strong>{formatLabel(member.status)}</strong></div>
            <div><span>Datum vpisa</span><strong>{formatDate(member.joinedAt)}</strong></div>
            <div><span>Datum rojstva</span><strong>{member.dateOfBirth ? formatDate(member.dateOfBirth) : "-"}</strong></div>
            <div><span>Naslov</span><strong>{member.address ?? "-"}</strong></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Narocnina</span><h3>Trenutni paket</h3></div></div>
          {activeSubscription ? (
            <div className="detail-list">
              <div><span>Paket</span><strong>{activeSubscription.plan.name}</strong></div>
              <div><span>Velja do</span><strong>{formatDate(activeSubscription.endDate)}</strong></div>
              <div><span>Status</span><strong>{formatLabel(activeSubscription.status)}</strong></div>
              <div><span>Cena</span><strong>{formatCurrency(activeSubscription.plan.priceCents)}</strong></div>
            </div>
          ) : (
            <p className="empty-state">Clan nima aktivne narocnine.</p>
          )}
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Prisotnost</span><h3>Zadnji obiski</h3></div></div>
          <div className="table-list">
            {member.attendances.slice(0, 10).map((attendance) => (
              <div key={attendance.id} className="table-row">
                <div>
                  <strong>{attendance.workout?.title ?? "Samostojni obisk"}</strong>
                  <span>{attendance.workout?.trainer.fullName ?? "-"}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatLabel(attendance.method)}</strong>
                  <span>{formatDateTime(attendance.checkedInAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Placila</span><h3>Zadnja placila</h3></div></div>
          <div className="table-list">
            {member.payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="table-row">
                <div>
                  <strong>{payment.description ?? "Narocnina"}</strong>
                  <span>{payment.subscriptionId ? "Narocnina" : "Rocno placilo"}</span>
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

      <section className="panel-card">
        <div className="panel-card-header"><div><span className="section-kicker">Zgodovina</span><h3>Vse narocnine</h3></div></div>
        <div className="table-list">
          {member.subscriptions.map((subscription) => (
            <div key={subscription.id} className="table-row">
              <div>
                <strong>{subscription.plan.name}</strong>
                <span>{formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}</span>
              </div>
              <div className="table-row-meta">
                <strong>{formatLabel(subscription.status)}</strong>
                <span>{formatCurrency(subscription.plan.priceCents)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
