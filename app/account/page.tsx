import { cancelMySubscription, cancelWorkoutReservation, logoutUser } from "@/app/actions";
import { MemberShell } from "@/components/member-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime, formatLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ subscription?: string; booking?: string }>;
}) {
  const user = await requireUser();
  const memberId = user.memberId;
  const params = (await searchParams) ?? {};
  const now = new Date();

  const [subscriptions, member, upcomingReservations, attendanceCount] = await Promise.all([
    memberId
      ? prisma.subscription.findMany({
          where: { memberId },
          include: { plan: true },
          orderBy: { endDate: "desc" },
        })
      : Promise.resolve([]),
    memberId ? prisma.member.findUnique({ where: { id: memberId } }) : Promise.resolve(null),
    memberId
      ? prisma.attendance.findMany({
          where: {
            memberId,
            workoutId: { not: null },
            workout: { scheduledAt: { gte: now } },
          },
          include: {
            workout: {
              include: { trainer: true, _count: { select: { attendances: true } } },
            },
          },
          orderBy: { workout: { scheduledAt: "asc" } },
          take: 4,
        })
      : Promise.resolve([]),
    memberId ? prisma.attendance.count({ where: { memberId } }) : Promise.resolve(0),
  ]);

  const activeSubscription = subscriptions.find((sub) => sub.active) ?? subscriptions[0];
  const accountStats = [
    { label: "Rezervirani treningi", value: upcomingReservations.length },
    { label: "Vsi obiski", value: attendanceCount },
    { label: "Status narocnine", value: activeSubscription ? formatLabel(activeSubscription.status) : "Brez paketa" },
  ];

  return (
    <MemberShell
      title="Moj racun"
      description="Pregled narocnine, rezerviranih terminov in vseh kljucnih podatkov za clana."
      actions={<form action={logoutUser}><button className="ghost-link" type="submit">Odjava</button></form>}
    >
      <section className="member-page-grid">
        <article className="panel-card member-hero-card">
          <span className="section-kicker">Profil</span>
          <h3>{member?.fullName ?? user.email}</h3>
          <p className="support-copy">
            Tukaj lahko hitro preveris svoj paket, spremljas prihodnje rezervacije in uredis narocnino brez obiska recepcije.
          </p>
          <div className="account-overview-grid">
            {accountStats.map((item) => (
              <div key={item.label} className="account-stat-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          {params.subscription === "cancelled" ? (
            <p className="support-note">Narocnina je preklicana. Uporabniski racun je ostal shranjen v bazi.</p>
          ) : null}
          {params.booking === "member" ? (
            <p className="empty-state">Rezervacija je mozna samo za uporabnika, ki je povezan s clanom v bazi.</p>
          ) : null}
        </article>

        <article className="panel-card">
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
              <div className="action-row account-action-row">
                <Link href="/workouts" className="primary-button">Rezerviraj trening</Link>
                <form action={cancelMySubscription} className="account-danger-form">
                  <button className="danger-button" type="submit">Odjavi se od narocnine</button>
                </form>
              </div>
            </>
          ) : (
            <div className="empty-state">
              Narocnina se se ne vodi.
            </div>
          )}
        </article>

        <article className="panel-card panel-card-wide">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Rezervacije</span>
              <h3>Prihodnji treningi</h3>
            </div>
            <Link href="/workouts" className="ghost-link">Poglej vse termine</Link>
          </div>
          {upcomingReservations.length === 0 ? (
            <p className="empty-state">Trenutno nimas rezerviranega nobenega termina.</p>
          ) : (
            <div className="reservation-list">
              {upcomingReservations.map((reservation) => (
                <article key={reservation.id} className="reservation-item">
                  <div>
                    <strong>{reservation.workout?.title ?? "Trening"}</strong>
                    <span>{reservation.workout?.trainer.fullName ?? "Brez trenerja"}</span>
                  </div>
                  <div>
                    <strong>{reservation.workout ? formatDateTime(reservation.workout.scheduledAt) : "Termin v pripravi"}</strong>
                    <span>
                      {reservation.workout?._count.attendances ?? 0}/{reservation.workout?.capacity ?? 0} prijavljenih
                    </span>
                  </div>
                  <form action={cancelWorkoutReservation}>
                    <input type="hidden" name="workoutId" value={reservation.workoutId ?? ""} />
                    <button className="ghost-link" type="submit">Preklici</button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </MemberShell>
  );
}
