import Link from "next/link";
import { createWorkout } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getWorkoutsPageData } from "@/lib/dashboard-data";
import { formatDateTime, formatLabel } from "@/lib/utils";

export default async function AdminWorkoutsPage() {
  const { workouts, trainers } = await getWorkoutsPageData();

  return (
    <DashboardShell
      title="Treningi"
      description="Urejanje urnika, kapacitet in pregled prijav na termine v enem mestu."
    >
      <section className="content-layout">
        <article className="panel-card form-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Nov termin</span>
              <h3>Dodaj trening</h3>
            </div>
          </div>

          <form action={createWorkout} className="admin-form">
            <label><span>Naziv</span><input name="title" required /></label>
            <label>
              <span>Trener</span>
              <select name="trainerId" required defaultValue="">
                <option value="" disabled>Izberi trenerja</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>{trainer.fullName}</option>
                ))}
              </select>
            </label>
            <label><span>Termin</span><input name="scheduledAt" type="datetime-local" required /></label>
            <label><span>Trajanje (min)</span><input name="durationMin" type="number" min="15" defaultValue="60" required /></label>
            <label><span>Kapaciteta</span><input name="capacity" type="number" min="1" defaultValue="12" required /></label>
            <label><span>Lokacija</span><input name="location" /></label>
            <label><span>Tip</span><input name="type" placeholder="HIIT, Mobility ..." /></label>
            <label>
              <span>Nivo</span>
              <select name="level" defaultValue="BEGINNER">
                <option value="BEGINNER">Zacetni</option>
                <option value="INTERMEDIATE">Srednji</option>
                <option value="ADVANCED">Napredni</option>
              </select>
            </label>
            <label className="form-span-2"><span>Opis</span><textarea name="description" rows={4} /></label>
            <button className="primary-button" type="submit">Shrani termin</button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Urnik</span>
              <h3>Prihodnji treningi</h3>
            </div>
          </div>

          <div className="table-list">
            {workouts.map((workout) => (
              <div key={workout.id} className="table-row table-row-actions">
                <div>
                  <strong>{workout.title}</strong>
                  <span>{workout.trainer.fullName} · {formatDateTime(workout.scheduledAt)}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatLabel(workout.level)}</strong>
                  <span>{workout._count.attendances}/{workout.capacity} prijavljenih</span>
                </div>
                <Link className="ghost-link" href={`/admin/workouts/${workout.id}`}>
                  Podrobnosti
                </Link>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
