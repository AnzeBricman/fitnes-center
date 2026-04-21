import { cancelMySubscription, logoutUser } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { formatCurrency, formatDate, formatLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ subscription?: string }>;
}) {
  const user = await requireUser();
  const memberId = user.memberId;
  const params = (await searchParams) ?? {};

  const [subscriptions, member] = await Promise.all([
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
        {params.subscription === "cancelled" ? (
          <p className="support-note">Narocnina je preklicana. Uporabniski racun je ostal shranjen v bazi.</p>
        ) : null}
        <form action={logoutUser}>
          <button className="ghost-link" type="submit">Odjava</button>
        </form>
      </section>

      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Narocnina</span>
            <h3>Trenutni paket</h3>
          </div>
          <Link href="/account/change-plan" className="ghost-link">Spremeni narocnino</Link>
        </div>
        {activeSubscription ? (
          <>
            <div className="detail-list">
              <div><span>Paket</span><strong>{activeSubscription.plan.name}</strong></div>
              <div><span>Velja do</span><strong>{formatDate(activeSubscription.endDate)}</strong></div>
              <div><span>Status</span><strong>{formatLabel(activeSubscription.status)}</strong></div>
              <div><span>Cena</span><strong>{formatCurrency(activeSubscription.plan.priceCents)}</strong></div>
            </div>
            <form action={cancelMySubscription} className="account-danger-form">
              <button className="danger-button" type="submit">Odjavi se od narocnine</button>
            </form>
          </>
        ) : (
          <p className="empty-state">Narocnina se se ne vodi.</p>
        )}
      </section>
    </main>
  );
}
