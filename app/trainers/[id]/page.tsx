import Link from "next/link";
import { notFound } from "next/navigation";
import { requestTrainerReservation } from "@/app/actions";
import { MemberShell } from "@/components/member-shell";
import { getSessionUser } from "@/lib/auth";
import { getPlanPermissions, isSubscriptionActive } from "@/lib/plan-permissions";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

function toInputDateTimeValue(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function TrainerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ trainerRequest?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const user = await getSessionUser();
  const memberId = user?.memberId ?? null;
  const now = new Date();
  const defaultPreferredAt = new Date(now);
  defaultPreferredAt.setDate(defaultPreferredAt.getDate() + 1);
  defaultPreferredAt.setHours(10, 0, 0, 0);

  const [trainer, activeSubscription, myRequests] = await Promise.all([
    prisma.trainer.findUnique({
      where: { id },
      include: {
        workouts: {
          where: { scheduledAt: { gte: now }, status: "SCHEDULED" },
          orderBy: { scheduledAt: "asc" },
          take: 5,
          include: { _count: { select: { attendances: true } } },
        },
      },
    }),
    memberId
      ? prisma.subscription.findFirst({
          where: { memberId, active: true, status: "ACTIVE", endDate: { gte: now } },
          include: { plan: true },
          orderBy: { endDate: "desc" },
        })
      : Promise.resolve(null),
    memberId
      ? prisma.trainingRequest.findMany({
          where: { memberId, trainerId: id },
          orderBy: { preferredAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  if (!trainer) {
    notFound();
  }

  const permissions = getPlanPermissions(activeSubscription?.plan);
  const hasActiveSubscription = isSubscriptionActive(activeSubscription, now);
  const canRequestTrainer =
    user?.role === "MEMBER" && hasActiveSubscription && permissions.canRequestTrainer && trainer.status === "ACTIVE";

  const message =
    query.trainerRequest === "confirmed"
      ? "Termin s trenerjem je rezerviran."
      : query.trainerRequest === "success"
        ? "Zahteva za termin je poslana trenerju."
      : query.trainerRequest === "subscription"
        ? "Za rezervacijo trenerja potrebujes aktivno narocnino."
        : query.trainerRequest === "plan"
          ? "Tvoj trenutni paket ne vkljucuje rezervacije osebnega trenerja."
          : query.trainerRequest === "busy"
            ? "Trener je v izbranem casu ze zaseden. Izberi drug termin."
            : query.trainerRequest === "past"
              ? "Izberi termin v prihodnosti."
              : query.trainerRequest === "missing"
                ? "Izbrani trener ali termin ni veljaven."
                : "";

  return (
    <MemberShell
      title={trainer.fullName}
      description={`${trainer.specialty} - ${trainer.bio ?? "osebni pristop k napredku, tehniki in redni vadbi."}`}
      actions={<Link href="/trainers" className="ghost-link">Vsi trenerji</Link>}
    >
      {message ? (
        <p className={query.trainerRequest === "confirmed" || query.trainerRequest === "success" ? "support-note" : "empty-state"}>{message}</p>
      ) : null}

      <section className="member-page-grid">
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Profil trenerja</span>
              <h3>{trainer.fullName}</h3>
            </div>
            <span className="pricing-chip">{formatLabel(trainer.status)}</span>
          </div>
          <div className="detail-list">
            <div><span>Specializacija</span><strong>{trainer.specialty}</strong></div>
            <div><span>Email</span><strong>{trainer.email}</strong></div>
            <div><span>Telefon</span><strong>{trainer.phone ?? "-"}</strong></div>
            <div><span>Aktiven od</span><strong>{trainer.startedAt ? formatDateTime(trainer.startedAt) : "-"}</strong></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Osebni termin</span>
              <h3>Rezerviraj trenerja</h3>
            </div>
          </div>

          {user?.role !== "MEMBER" ? (
            <div className="empty-state">
              Za rezervacijo trenerja se prijavi kot clan.
            </div>
          ) : !hasActiveSubscription ? (
            <div className="empty-state">
              Za rezervacijo trenerja potrebujes aktivno narocnino.
            </div>
          ) : !permissions.canRequestTrainer ? (
            <div className="empty-state">
              Paket {activeSubscription?.plan.name} ne vkljucuje osebnih terminov. Nadgradi na Elite za rezervacijo trenerja.
            </div>
          ) : (
            <form action={requestTrainerReservation} className="admin-form">
              <input type="hidden" name="trainerId" value={trainer.id} />
              <label>
                <span>Zeleni termin</span>
                <input
                  type="datetime-local"
                  name="preferredAt"
                  defaultValue={toInputDateTimeValue(defaultPreferredAt)}
                  required
                />
              </label>
              <label>
                <span>Trajanje</span>
                <select name="durationMin" defaultValue="60">
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </label>
              <label className="form-span-2">
                <span>Opomba za trenerja</span>
                <textarea
                  name="note"
                  rows={4}
                  placeholder="Cilj treninga, morebitne omejitve, zeleni fokus ..."
                />
              </label>
              <button className="primary-button" type="submit" disabled={!canRequestTrainer}>
                Rezerviraj termin
              </button>
            </form>
          )}
        </article>

        <article className="panel-card panel-card-wide">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Skupinski termini</span>
              <h3>Prihodnji treningi tega trenerja</h3>
            </div>
            <Link href="/workouts" className="ghost-link">Vsi treningi</Link>
          </div>
          {trainer.workouts.length === 0 ? (
            <p className="empty-state">Trener trenutno nima razpisanih prihodnjih skupinskih terminov.</p>
          ) : (
            <div className="reservation-list">
              {trainer.workouts.map((workout) => (
                <article key={workout.id} className="reservation-item">
                  <div>
                    <strong>{workout.title}</strong>
                    <span>{workout.location ?? "Glavna dvorana"}</span>
                  </div>
                  <div>
                    <strong>{formatDateTime(workout.scheduledAt)}</strong>
                    <span>{workout._count.attendances}/{workout.capacity} prijavljenih</span>
                  </div>
                  <Link href="/workouts" className="ghost-link">Rezerviraj</Link>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel-card panel-card-wide">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Moje zahteve</span>
              <h3>Moji termini pri tem trenerju</h3>
            </div>
          </div>
          {myRequests.length === 0 ? (
            <p className="empty-state">Pri tem trenerju se nimas poslane zahteve za osebni termin.</p>
          ) : (
            <div className="reservation-list">
              {myRequests.map((request) => (
                <article key={request.id} className="reservation-item">
                  <div>
                    <strong>{formatDateTime(request.preferredAt)}</strong>
                    <span>{request.durationMin} min</span>
                  </div>
                  <div>
                    <strong>{formatLabel(request.status)}</strong>
                    <span>{request.note ?? "Brez opombe"}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </MemberShell>
  );
}
