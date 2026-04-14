import { createMember, deleteMember } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getMembersPageData } from "@/lib/dashboard-data";
import { formatDate, formatLabel } from "@/lib/utils";

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; sort?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { members, plans } = await getMembersPageData(params);

  return (
    <DashboardShell
      title="Clani"
      description="CRUD za clane, iskanje, filtri in pregled povezanih narocnin."
    >
      <section className="content-layout">
        <article className="panel-card form-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Nov clan</span>
              <h3>Dodaj uporabnika</h3>
            </div>
          </div>

          <form action={createMember} className="admin-form">
            <label><span>Ime in priimek</span><input name="fullName" required /></label>
            <label><span>Email</span><input name="email" type="email" required /></label>
            <label><span>Telefon</span><input name="phone" /></label>
            <label>
              <span>Status</span>
              <select name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">Aktiven</option>
                <option value="EXPIRING">Potece kmalu</option>
                <option value="OVERDUE">Placilo zamuja</option>
                <option value="INACTIVE">Neaktiven</option>
              </select>
            </label>
            <label className="form-span-2"><span>Opombe</span><textarea name="notes" rows={4} /></label>
            <button type="submit" className="primary-button">Shrani clana</button>
          </form>

          <div className="support-note">
            <strong>Paketi na voljo:</strong>
            <span>{plans.map((plan) => plan.name).join(", ")}</span>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <span className="section-kicker">Iskanje</span>
              <h3>Filtriranje in sortiranje</h3>
            </div>
          </div>

          <form className="filter-form" method="get">
            <input name="search" placeholder="Isci po imenu ali emailu" defaultValue={params.search} />
            <select name="status" defaultValue={params.status || ""}>
              <option value="">Vsi statusi</option>
              <option value="ACTIVE">Aktiven</option>
              <option value="EXPIRING">Potece kmalu</option>
              <option value="OVERDUE">Placilo zamuja</option>
              <option value="INACTIVE">Neaktiven</option>
            </select>
            <select name="sort" defaultValue={params.sort || ""}>
              <option value="">Najnovejsi</option>
              <option value="name">Ime A-Z</option>
              <option value="status">Status</option>
            </select>
            <button className="ghost-link" type="submit">Uporabi</button>
          </form>

          <div className="table-list">
            {members.map((member) => (
              <div key={member.id} className="table-row table-row-actions">
                <div>
                  <strong>{member.fullName}</strong>
                  <span>
                    {member.email} · {member.subscription?.plan.name ?? "Brez paketa"} ·{" "}
                    {formatLabel(member.status)}
                  </span>
                </div>
                <div className="table-row-meta">
                  <strong>{member._count.attendances} obiskov</strong>
                  <span>{formatDate(member.createdAt)}</span>
                </div>
                <form action={deleteMember}>
                  <input type="hidden" name="id" value={member.id} />
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
