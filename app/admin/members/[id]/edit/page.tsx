import { notFound } from "next/navigation";
import { updateMember } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getMemberProfileData } from "@/lib/dashboard-data";

function toDateInput(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberProfileData(id);

  if (!member) {
    notFound();
  }

  return (
    <DashboardShell
      title="Uredi clana"
      description="Posodobi podatke o clanu in statusu narocnine."
    >
      <section className="panel-card form-card">
        <div className="panel-card-header"><div><span className="section-kicker">Urejanje</span><h3>{member.fullName}</h3></div></div>
        <form action={updateMember} className="admin-form">
          <input type="hidden" name="id" value={member.id} />
          <label><span>Ime in priimek</span><input name="fullName" defaultValue={member.fullName} required /></label>
          <label><span>Email</span><input name="email" type="email" defaultValue={member.email} required /></label>
          <label><span>Telefon</span><input name="phone" defaultValue={member.phone ?? ""} /></label>
          <label><span>Datum rojstva</span><input name="dateOfBirth" type="date" defaultValue={toDateInput(member.dateOfBirth)} /></label>
          <label>
            <span>Spol</span>
            <select name="gender" defaultValue={member.gender ?? "UNSPECIFIED"}>
              <option value="UNSPECIFIED">Ni doloceno</option>
              <option value="MALE">Moski</option>
              <option value="FEMALE">Zenski</option>
              <option value="OTHER">Drugo</option>
            </select>
          </label>
          <label><span>Naslov</span><input name="address" defaultValue={member.address ?? ""} /></label>
          <label><span>Datum vpisa</span><input name="joinedAt" type="date" defaultValue={toDateInput(member.joinedAt)} /></label>
          <label>
            <span>Status</span>
            <select name="status" defaultValue={member.status}>
              <option value="ACTIVE">Aktiven</option>
              <option value="EXPIRING">Potece kmalu</option>
              <option value="OVERDUE">Placilo zamuja</option>
              <option value="INACTIVE">Neaktiven</option>
            </select>
          </label>
          <label className="form-span-2"><span>Opombe</span><textarea name="notes" rows={4} defaultValue={member.notes ?? ""} /></label>
          <button type="submit" className="primary-button">Shrani spremembe</button>
        </form>
      </section>
    </DashboardShell>
  );
}
