import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTrainerProfileData } from "@/lib/dashboard-data";
import { formatDateTime, formatLabel } from "@/lib/utils";

export default async function TrainerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trainer = await getTrainerProfileData(id);

  if (!trainer) {
    notFound();
  }

  const activeWorkouts = trainer.workouts.filter((workout) => workout.status === "SCHEDULED");
  const totalAttendees = trainer.workouts.reduce((sum, workout) => sum + workout.attendances.length, 0);

  return (
    <DashboardShell
      title={trainer.fullName}
      description="Profil trenerja z urnikom in statistiko treningov."
      actions={
        <div className="header-actions">
          <Link className="ghost-link" href={`/admin/trainers/${trainer.id}/edit`}>Uredi trenerja</Link>
          <Link className="ghost-link" href="/admin/workouts">Dodaj trening</Link>
        </div>
      }
    >
      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Podatki</span><h3>Osnovno</h3></div></div>
          <div className="detail-list">
            <div><span>Email</span><strong>{trainer.email}</strong></div>
            <div><span>Telefon</span><strong>{trainer.phone ?? "-"}</strong></div>
            <div><span>Specializacija</span><strong>{trainer.specialty}</strong></div>
            <div><span>Status</span><strong>{formatLabel(trainer.status)}</strong></div>
            <div><span>Zacetek dela</span><strong>{trainer.startedAt ? formatDateTime(trainer.startedAt) : "-"}</strong></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Povzetek</span><h3>Statistika</h3></div></div>
          <div className="detail-list">
            <div><span>Aktivni termini</span><strong>{activeWorkouts.length}</strong></div>
            <div><span>Skupno treningov</span><strong>{trainer.workouts.length}</strong></div>
            <div><span>Skupno obiskov</span><strong>{totalAttendees}</strong></div>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-card-header"><div><span className="section-kicker">Urnik</span><h3>Treningi</h3></div></div>
        <div className="table-list">
          {trainer.workouts.map((workout) => (
            <div key={workout.id} className="table-row">
              <div>
                <strong>{workout.title}</strong>
                <span>{formatDateTime(workout.scheduledAt)}</span>
              </div>
              <div className="table-row-meta">
                <strong>{workout.attendances.length} prisotnih</strong>
                <span>{formatLabel(workout.status)}</span>
              </div>
              <Link className="ghost-link" href={`/admin/workouts/${workout.id}`}>Podrobnosti</Link>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
