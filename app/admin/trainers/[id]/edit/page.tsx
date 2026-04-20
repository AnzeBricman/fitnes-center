import { notFound } from "next/navigation";
import { updateTrainer } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTrainerProfileData } from "@/lib/dashboard-data";

function toDateInput(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default async function EditTrainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trainer = await getTrainerProfileData(id);

  if (!trainer) {
    notFound();
  }

  return (
    <DashboardShell
      title="Uredi trenerja"
      description="Posodobi podatke o trenerju in statusu."
    >
      <section className="panel-card form-card">
        <div className="panel-card-header"><div><span className="section-kicker">Urejanje</span><h3>{trainer.fullName}</h3></div></div>
        <form action={updateTrainer} className="admin-form">
          <input type="hidden" name="id" value={trainer.id} />
          <label><span>Ime in priimek</span><input name="fullName" defaultValue={trainer.fullName} required /></label>
          <label><span>Email</span><input name="email" type="email" defaultValue={trainer.email} required /></label>
          <label><span>Telefon</span><input name="phone" defaultValue={trainer.phone ?? ""} /></label>
          <label><span>Specializacija</span><input name="specialty" defaultValue={trainer.specialty} required /></label>
          <label><span>Zacetek dela</span><input name="startedAt" type="date" defaultValue={toDateInput(trainer.startedAt)} /></label>
          <label>
            <span>Status</span>
            <select name="status" defaultValue={trainer.status}>
              <option value="ACTIVE">Aktiven</option>
              <option value="INACTIVE">Neaktiven</option>
            </select>
          </label>
          <label className="form-span-2"><span>Bio</span><textarea rows={4} name="bio" defaultValue={trainer.bio ?? ""} /></label>
          <button type="submit" className="primary-button">Shrani spremembe</button>
        </form>
      </section>
    </DashboardShell>
  );
}
