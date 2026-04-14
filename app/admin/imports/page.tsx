import { importMembers } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getImportPageData } from "@/lib/dashboard-data";
import { formatDateTime, formatLabel } from "@/lib/utils";

export default async function ImportsPage() {
  const jobs = await getImportPageData();

  return (
    <DashboardShell
      title="Uvoz"
      description="Uvoz clanov iz CSV ali Excel datotek z zgodovino izvedenih uvozov."
    >
      <section className="content-layout">
        <article className="panel-card form-card">
          <div className="panel-card-header"><div><span className="section-kicker">CSV / Excel</span><h3>Uvozi clane</h3></div></div>
          <form action={importMembers} className="admin-form" encType="multipart/form-data">
            <label className="form-span-2">
              <span>Datoteka</span>
              <input type="file" name="file" accept=".csv,.xlsx,.xls" required />
            </label>
            <button className="primary-button" type="submit">Zacni uvoz</button>
          </form>
          <p className="support-note">Podprta polja: `fullName`, `email`, `phone`, `notes` ali slovenska imena stolpcev.</p>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Zgodovina</span><h3>Import jobi</h3></div></div>
          <div className="table-list">
            {jobs.map((job) => (
              <div key={job.id} className="table-row">
                <div>
                  <strong>{job.fileName}</strong>
                  <span>{formatLabel(job.format)} · {job.rowCount} vrstic</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatLabel(job.status)}</strong>
                  <span>{formatDateTime(job.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
