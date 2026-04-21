import { MemberShell } from "@/components/member-shell";
import { prisma } from "@/lib/prisma";
import { formatDate, formatLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const trainers = await prisma.trainer.findMany({
    where: { status: "ACTIVE" },
    include: {
      workouts: {
        where: { scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 1,
      },
      _count: { select: { workouts: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <MemberShell
      title="Trenerji"
      description="Spoznaj ekipo, njihove specializacije in poglej, kdaj vodijo naslednji termin."
    >
      <section className="trainer-card-grid">
        {trainers.map((trainer) => (
          <article key={trainer.id} className="panel-card trainer-card">
            <span className="section-kicker">{trainer.specialty}</span>
            <h3>{trainer.fullName}</h3>
            <p className="trainer-card-copy">
              {trainer.bio ?? "Izkušen trener, ki pomaga pri pravilni tehniki, napredku in motivaciji."}
            </p>
            <div className="card-meta-grid">
              <div className="info-chip">
                <span>Status</span>
                <strong>{formatLabel(trainer.status)}</strong>
              </div>
              <div className="info-chip">
                <span>Vsi treningi</span>
                <strong>{trainer._count.workouts}</strong>
              </div>
            </div>
            <div className="trainer-next-slot">
              <span>Naslednji termin</span>
              <strong>
                {trainer.workouts[0] ? formatDate(trainer.workouts[0].scheduledAt) : "Trenutno brez termina"}
              </strong>
              <small>{trainer.workouts[0]?.title ?? "Objava novega termina kmalu."}</small>
            </div>
          </article>
        ))}
      </section>
    </MemberShell>
  );
}
