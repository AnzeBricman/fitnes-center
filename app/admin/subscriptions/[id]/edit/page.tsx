import { notFound } from "next/navigation";
import { updatePlan } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });

  if (!plan) {
    notFound();
  }

  return (
    <DashboardShell
      title="Uredi paket"
      description={`Urejanje narocninskega paketa (${formatCurrency(plan.priceCents)}).`}
    >
      <section className="panel-card form-card">
        <div className="panel-card-header"><div><span className="section-kicker">Paket</span><h3>{plan.name}</h3></div></div>
        <form action={updatePlan} className="admin-form">
          <input type="hidden" name="id" value={plan.id} />
          <label><span>Naziv</span><input name="name" defaultValue={plan.name} required /></label>
          <label><span>Cena (EUR)</span><input type="number" name="price" step="0.01" defaultValue={(plan.priceCents / 100).toFixed(2)} required /></label>
          <label><span>Trajanje (dni)</span><input type="number" name="durationDays" defaultValue={plan.durationDays} required /></label>
          <label>
            <span>Status</span>
            <select name="isActive" defaultValue={plan.isActive ? "true" : "false"}>
              <option value="true">Aktiven</option>
              <option value="false">Neaktiven</option>
            </select>
          </label>
          <label className="form-span-2"><span>Opis</span><textarea rows={3} name="description" defaultValue={plan.description ?? ""} /></label>
          <button className="primary-button" type="submit">Shrani paket</button>
        </form>
      </section>
    </DashboardShell>
  );
}
