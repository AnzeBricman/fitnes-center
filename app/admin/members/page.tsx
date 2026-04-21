import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getMembersPageData } from "@/lib/dashboard-data";
import { formatDate, formatLabel } from "@/lib/utils";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; sort?: string; planId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { members, plans } = await getMembersPageData(params);

  return (
    <DashboardShell
      title="Clani"
      description="Napredni pregled baze clanov z iskanjem, statusi, sortiranje in filtriranjem po paketu."
    >
      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Napredni filter</span>
            <h3>Iskanje clanov</h3>
          </div>
        </div>

        <form method="get" className="filter-form members-filter-form">
          <input
            name="search"
            defaultValue={params.search || ""}
            placeholder="Ime, email ..."
          />
          <select name="status" defaultValue={params.status || ""}>
            <option value="">Vsi statusi</option>
            <option value="ACTIVE">Aktivni</option>
            <option value="EXPIRING">Potece kmalu</option>
            <option value="OVERDUE">Placilo zamuja</option>
            <option value="INACTIVE">Neaktivni</option>
          </select>
          <select name="planId" defaultValue={params.planId || ""}>
            <option value="">Vsi paketi</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
          <select name="sort" defaultValue={params.sort || "created"}>
            <option value="created">Najnovejsi</option>
            <option value="name">Ime</option>
            <option value="status">Status</option>
            <option value="joined">Datum vpisa</option>
          </select>
          <button className="ghost-link" type="submit">Filtriraj</button>
        </form>
      </section>

      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Rezultati</span>
            <h3>Najdeni clani</h3>
          </div>
        </div>

        <div className="table-list">
          {members.map((member) => (
            <div key={member.id} className="table-row table-row-actions">
              <div>
                <strong>{member.fullName}</strong>
                <span>{member.email}</span>
              </div>
              <div className="table-row-meta">
                <strong>{member.subscriptions[0]?.plan.name ?? "Brez paketa"}</strong>
                <span>{formatLabel(member.status)} · {formatDate(member.joinedAt)}</span>
              </div>
              <Link className="ghost-link" href={`/admin/members/${member.id}`}>
                Profil
              </Link>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
