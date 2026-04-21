import Link from "next/link";
import { createTrainer } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTrainersPageData } from "@/lib/dashboard-data";
import { formatDate, formatLabel } from "@/lib/utils";

export default async function AdminTrainersPage() {
  const trainers = await getTrainersPageData();

  return (
    <DashboardShell
      title="Trenerji"
      description="Pregled ekipe, specializacij in naslednjih terminov z moznostjo hitrega dodajanja trenerjev."
    >
      <section className="content-layout">
        <article className="panel-card form-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Nova oseba</span>
              <h3>Dodaj trenerja</h3>
            </div>
          </div>

          <form action={createTrainer} className="admin-form">
            <label><span>Ime in priimek</span><input name="fullName" required /></label>
            <label><span>Email</span><input name="email" type="email" required /></label>
            <label><span>Specializacija</span><input name="specialty" required /></label>
            <label><span>Telefon</span><input name="phone" /></label>
            <label className="form-span-2"><span>Bio</span><textarea name="bio" rows={4} /></label>
            <button className="primary-button" type="submit">Shrani trenerja</button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Ekipa</span>
              <h3>Aktivni trenerji</h3>
            </div>
          </div>

          <div className="table-list">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="table-row table-row-actions">
                <div>
                  <strong>{trainer.fullName}</strong>
                  <span>{trainer.specialty}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatLabel(trainer.status)}</strong>
                  <span>
                    {trainer.workouts[0]
                      ? `${trainer.workouts[0].title} · ${formatDate(trainer.workouts[0].scheduledAt)}`
                      : "Trenutno brez naslednjega termina"}
                  </span>
                </div>
                <Link className="ghost-link" href={`/admin/trainers/${trainer.id}`}>
                  Profil
                </Link>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
