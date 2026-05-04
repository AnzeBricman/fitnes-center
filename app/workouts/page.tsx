import Link from "next/link";
import { cancelWorkoutReservation, reserveWorkout } from "@/app/actions";
import { MemberShell } from "@/components/member-shell";
import { getSessionUser } from "@/lib/auth";
import { getPlanPermissions, isSubscriptionActive } from "@/lib/plan-permissions";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams?: Promise<{ booking?: string; level?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const user = await getSessionUser();
  const memberId = user?.memberId ?? null;
  const attendanceFilterMemberId = memberId ?? "__guest__";
  const now = new Date();

  const [workouts, activeSubscription] = await Promise.all([
    prisma.workout.findMany({
    where: {
      scheduledAt: { gte: now },
      status: "SCHEDULED",
      ...(params.level ? { level: params.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" } : {}),
    },
    include: {
      trainer: true,
      attendances: { where: { memberId: attendanceFilterMemberId }, take: 1 },
      _count: { select: { attendances: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 18,
    }),
    memberId
      ? prisma.subscription.findFirst({
          where: { memberId, active: true, status: "ACTIVE", endDate: { gte: now } },
          include: { plan: true },
          orderBy: { endDate: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const permissions = getPlanPermissions(activeSubscription?.plan);
  const hasActiveSubscription = isSubscriptionActive(activeSubscription, now);
  const usedWorkoutReservations =
    memberId && activeSubscription && permissions.monthlyWorkoutLimit !== null
      ? await prisma.attendance.count({
          where: {
            memberId,
            workoutId: { not: null },
            workout: {
              scheduledAt: {
                gte: activeSubscription.startDate,
                lte: activeSubscription.endDate,
              },
            },
          },
        })
      : 0;
  const reachedWorkoutLimit =
    permissions.monthlyWorkoutLimit !== null && usedWorkoutReservations >= permissions.monthlyWorkoutLimit;

  const bookingMessage =
    params.booking === "success"
      ? "Termin je uspesno rezerviran."
      : params.booking === "cancelled"
        ? "Rezervacija je bila preklicana."
        : params.booking === "subscription"
          ? "Za rezervacijo potrebujes aktivno narocnino."
          : params.booking === "full"
            ? "Na tem treningu ni vec prostih mest."
            : params.booking === "closed"
              ? "Ta termin ni vec na voljo za rezervacijo."
              : params.booking === "missing"
                ? "Izbrani trening ne obstaja vec."
                : params.booking === "plan"
                  ? "Tvoj trenutni paket ne vkljucuje rezervacij skupinskih treningov."
                  : params.booking === "limit"
                    ? "Dosegel si limit rezervacij za trenutni paket."
                    : "";

  return (
    <MemberShell
      title="Rezervacija treningov"
      description="Pregled prostih terminov, trenerjev in hitra prijava na trening v nekaj klikih."
      actions={
        <div className="period-filter member-filter-row">
          <Link href="/workouts" className={`period-chip${!params.level ? " period-chip-active" : ""}`}>Vsi nivoji</Link>
          <Link href="/workouts?level=BEGINNER" className={`period-chip${params.level === "BEGINNER" ? " period-chip-active" : ""}`}>Zacetni</Link>
          <Link href="/workouts?level=INTERMEDIATE" className={`period-chip${params.level === "INTERMEDIATE" ? " period-chip-active" : ""}`}>Srednji</Link>
          <Link href="/workouts?level=ADVANCED" className={`period-chip${params.level === "ADVANCED" ? " period-chip-active" : ""}`}>Napredni</Link>
        </div>
      }
    >
      {bookingMessage ? (
        <p className={params.booking === "success" || params.booking === "cancelled" ? "support-note" : "empty-state"}>
          {bookingMessage}
        </p>
      ) : null}

      {user?.role === "MEMBER" && activeSubscription ? (
        <p className="support-note">
          Paket {activeSubscription.plan.name}: {permissions.label}
          {permissions.monthlyWorkoutLimit !== null
            ? ` (${usedWorkoutReservations}/${permissions.monthlyWorkoutLimit} porabljeno)`
            : ""}
        </p>
      ) : null}

      {workouts.length === 0 ? (
        <p className="empty-state">
          Trenutno ni razpisanega nobenega prihodnjega termina za izbrani filter.
        </p>
      ) : null}

      <section className="workout-card-grid">
        {workouts.map((workout) => {
          const booked = Array.isArray(workout.attendances) && workout.attendances.length > 0;
          const remainingSpots = Math.max(workout.capacity - workout._count.attendances, 0);

          return (
            <article
              key={workout.id}
              className={`panel-card workout-card${booked ? " workout-card-booked" : ""}`}
            >
              <div className="workout-card-head">
                <div>
                  <span className="section-kicker">{formatLabel(workout.level)}</span>
                  <h3>{workout.title}</h3>
                </div>
                <span className="pricing-chip">{workout.type ?? "Skupinski trening"}</span>
              </div>

              <p className="trainer-card-copy">
                {workout.description ?? "Termin za clane, ki zelijo strukturiran trening z vodenjem trenerja."}
              </p>

              <div className="card-meta-grid">
                <div className="info-chip">
                  <span>Termin</span>
                  <strong>{formatDateTime(workout.scheduledAt)}</strong>
                </div>
                <div className="info-chip">
                  <span>Trajanje</span>
                  <strong>{workout.durationMin} min</strong>
                </div>
                <div className="info-chip">
                  <span>Trener</span>
                  <strong>{workout.trainer.fullName}</strong>
                </div>
                <div className="info-chip">
                  <span>Prosta mesta</span>
                  <strong>{remainingSpots}</strong>
                </div>
              </div>

              <div className="workout-card-footer">
                <div className="workout-card-meta">
                  <span>{workout.location ?? "Glavna dvorana"}</span>
                  <small>{workout._count.attendances}/{workout.capacity} prijavljenih</small>
                </div>
                {user?.role === "MEMBER" ? (
                  booked ? (
                    <form action={cancelWorkoutReservation} className="booking-form-inline">
                      <input type="hidden" name="workoutId" value={workout.id} />
                      <button className="ghost-link" type="submit">Preklici rezervacijo</button>
                    </form>
                  ) : (
                    <form action={reserveWorkout} className="booking-form-inline">
                      <input type="hidden" name="workoutId" value={workout.id} />
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={
                          remainingSpots === 0 ||
                          !hasActiveSubscription ||
                          !permissions.canReserveWorkouts ||
                          reachedWorkoutLimit
                        }
                      >
                        {remainingSpots === 0
                          ? "Zapolnjeno"
                          : !hasActiveSubscription
                            ? "Aktiviraj paket"
                            : !permissions.canReserveWorkouts
                              ? "Ni v paketu"
                              : reachedWorkoutLimit
                                ? "Limit dosezen"
                                : "Rezerviraj"}
                      </button>
                    </form>
                  )
                ) : user ? (
                  <Link href="/account" className="ghost-link">Odpri moj racun</Link>
                ) : (
                  <Link href="/login" className="primary-button">Prijavi se za rezervacijo</Link>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </MemberShell>
  );
}
