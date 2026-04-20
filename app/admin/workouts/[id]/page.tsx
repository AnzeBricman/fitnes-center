import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getWorkoutProfileData } from "@/lib/dashboard-data";
import { formatDateTime, formatLabel } from "@/lib/utils";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkoutProfileData(id);

  if (!workout) {
    notFound();
  }

  return (
    <DashboardShell
      title={workout.title}
      description="Podrobnosti treninga, prijavljeni clani in prisotnost."
      actions={
        <div className="header-actions">
          <Link className="ghost-link" href={`/admin/workouts/${workout.id}/edit`}>Uredi</Link>
          <Link className="ghost-link" href={`/admin/trainers/${workout.trainerId}`}>Trener</Link>
        </div>
      }
    >
      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Podatki</span><h3>Trening</h3></div></div>
          <div className="detail-list">
            <div><span>Trener</span><strong>{workout.trainer.fullName}</strong></div>
            <div><span>Termin</span><strong>{formatDateTime(workout.scheduledAt)}</strong></div>
            <div><span>Trajanje</span><strong>{workout.durationMin} min</strong></div>
            <div><span>Kapaciteta</span><strong>{workout.capacity}</strong></div>
            <div><span>Status</span><strong>{formatLabel(workout.status)}</strong></div>
            <div><span>Lokacija</span><strong>{workout.location ?? "-"}</strong></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Opis</span><h3>Vsebina treninga</h3></div></div>
          <p className="empty-state">{workout.description ?? "Opis ni na voljo."}</p>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-card-header"><div><span className="section-kicker">Prisotnost</span><h3>Prisotni clani</h3></div></div>
        <div className="table-list">
          {workout.attendances.map((attendance) => (
            <div key={attendance.id} className="table-row">
              <div>
                <strong>{attendance.member.fullName}</strong>
                <span>{attendance.member.email}</span>
              </div>
              <div className="table-row-meta">
                <strong>{formatLabel(attendance.method)}</strong>
                <span>{formatDateTime(attendance.checkedInAt)}</span>
              </div>
              <Link className="ghost-link" href={`/admin/members/${attendance.memberId}`}>Profil</Link>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
