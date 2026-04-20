import { notFound } from "next/navigation";
import { updateWorkout } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { toInputDateTimeValue } from "@/lib/utils";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [workout, trainers] = await Promise.all([
    prisma.workout.findUnique({ where: { id } }),
    prisma.trainer.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  if (!workout) {
    notFound();
  }

  return (
    <DashboardShell
      title="Uredi trening"
      description="Posodobi termin, trenerja in status treninga."
    >
      <section className="panel-card form-card">
        <div className="panel-card-header"><div><span className="section-kicker">Urejanje</span><h3>{workout.title}</h3></div></div>
        <form action={updateWorkout} className="admin-form">
          <input type="hidden" name="id" value={workout.id} />
          <label><span>Naziv</span><input name="title" defaultValue={workout.title} required /></label>
          <label>
            <span>Trener</span>
            <select name="trainerId" required defaultValue={workout.trainerId}>
              {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.fullName}</option>)}
            </select>
          </label>
          <label><span>Zacetek</span><input type="datetime-local" name="scheduledAt" defaultValue={toInputDateTimeValue(workout.scheduledAt)} required /></label>
          <label><span>Trajanje</span><input type="number" name="durationMin" defaultValue={workout.durationMin} required /></label>
          <label><span>Kapaciteta</span><input type="number" name="capacity" defaultValue={workout.capacity} required /></label>
          <label><span>Lokacija</span><input name="location" defaultValue={workout.location ?? ""} /></label>
          <label><span>Tip treninga</span><input name="type" defaultValue={workout.type ?? ""} /></label>
          <label>
            <span>Nivo</span>
            <select name="level" defaultValue={workout.level}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select name="status" defaultValue={workout.status}>
              <option value="SCHEDULED">Planirano</option>
              <option value="COMPLETED">Opravljeno</option>
              <option value="CANCELLED">Odpovedano</option>
            </select>
          </label>
          <label className="form-span-2"><span>Opis</span><textarea rows={4} name="description" defaultValue={workout.description ?? ""} /></label>
          <button type="submit" className="primary-button">Shrani spremembe</button>
        </form>
      </section>
    </DashboardShell>
  );
}
