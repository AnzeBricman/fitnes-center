import { createTrainer, deleteTrainer } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTrainersPageData } from "@/lib/dashboard-data";
import { formatDateTime } from "@/lib/utils";

export default async function TrainersPage() {
  const trainers = await getTrainersPageData();

  return (
    <DashboardShell
      title="Trenerji"
      description="Urejanje ekipe trenerjev in pregled njihovih naslednjih terminov."
    >
      <section className="content-layout">
        <article className="panel-card form-card">
          <div className="panel-card-header"><div><span className="section-kicker">Ekipa</span><h3>Dodaj trenerja</h3></div></div>
          <form action={createTrainer} className="admin-form">
            <label><span>Ime in priimek</span><input name="fullName" required /></label>
            <label><span>Email</span><input type="email" name="email" required /></label>
            <label><span>Telefon</span><input name="phone" /></label>
            <label><span>Specializacija</span><input name="specialty" required /></label>
            <label className="form-span-2"><span>Bio</span><textarea rows={4} name="bio" /></label>
            <button type="submit" className="primary-button">Shrani trenerja</button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Seznam</span><h3>Aktivna ekipa</h3></div></div>
          <div className="table-list">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="table-row table-row-actions">
                <div>
                  <strong>{trainer.fullName}</strong>
                  <span>{trainer.specialty}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{trainer._count.workouts} treningov</strong>
                  <span>{trainer.workouts[0] ? formatDateTime(trainer.workouts[0].scheduledAt) : "Brez termina"}</span>
                </div>
                <form action={deleteTrainer}>
                  <input type="hidden" name="id" value={trainer.id} />
                  <button className="danger-button" type="submit">Izbrisi</button>
                </form>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
