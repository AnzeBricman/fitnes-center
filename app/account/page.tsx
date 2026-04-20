import { changeMyPlan, logoutUser } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, formatLabel } from "@/lib/utils";

export default async function AccountPage() {
  const user = await requireUser();
  const memberId = user.memberId;

  const [plans, subscriptions, member] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { priceCents: "asc" } }),
    memberId
      ? prisma.subscription.findMany({
          where: { memberId },
          include: { plan: true },
          orderBy: { endDate: "desc" },
        })
      : Promise.resolve([]),
    memberId ? prisma.member.findUnique({ where: { id: memberId } }) : Promise.resolve(null),
  ]);

  const activeSubscription = subscriptions.find((sub) => sub.active) ?? subscriptions[0];

  return (
    <main className="landing-shell">
      <section className="panel-card">
        <span className="section-kicker">Moj racun</span>
        <h2>{member?.fullName ?? user.email}</h2>
        <p className="empty-state">Vloga: {formatLabel(user.role)}</p>
        <form action={logoutUser}>
          <button className="ghost-link" type="submit">Odjava</button>
        </form>
      </section>

      <section className="panel-card">
        <div className="panel-card-header"><div><span className="section-kicker">Narocnina</span><h3>Trenutni paket</h3></div></div>
        {activeSubscription ? (
          <div className="detail-list">
            <div><span>Paket</span><strong>{activeSubscription.plan.name}</strong></div>
            <div><span>Velja do</span><strong>{formatDate(activeSubscription.endDate)}</strong></div>
            <div><span>Status</span><strong>{formatLabel(activeSubscription.status)}</strong></div>
            <div><span>Cena</span><strong>{formatCurrency(activeSubscription.plan.priceCents)}</strong></div>
          </div>
        ) : (
          <p className="empty-state">Narocnina se se ne vodi.</p>
        )}
      </section>

      <section className="panel-card form-card">
        <div className="panel-card-header"><div><span className="section-kicker">Sprememba</span><h3>Zamenjaj paket</h3></div></div>
        <form className="admin-form" action={changeMyPlan}>
          <label className="form-span-2">
            <span>Izberi nov paket</span>
            <select name="planId" required defaultValue="">
              <option value="" disabled>Izberi novo narocnino</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatCurrency(plan.priceCents)} / {plan.durationDays} dni
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit">Spremeni paket</button>
        </form>
      </section>
    </main>
  );
}
