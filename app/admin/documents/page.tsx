import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDocumentsPageData } from "@/lib/dashboard-data";
import { formatDateTime, formatLabel } from "@/lib/utils";

export default async function DocumentsPage() {
  const documents = await getDocumentsPageData();

  return (
    <DashboardShell
      title="PDF dokumenti"
      description="Izvoz potrdil o clanstvu in mesecnih racunov v PDF obliki."
    >
      <section className="panel-card">
        <div className="panel-card-header"><div><span className="section-kicker">Dokumenti</span><h3>Potrdila in racuni</h3></div></div>
        <div className="table-list">
          {documents.map((document) => (
            <div key={document.id} className="table-row table-row-actions">
              <div>
                <strong>{document.title}</strong>
                <span>{formatLabel(document.type)} · {document.member?.fullName ?? "Brez clana"}</span>
              </div>
              <div className="table-row-meta">
                <strong>{formatDateTime(document.createdAt)}</strong>
                <span>{document.subscription?.plan.name ?? "Sistemski dokument"}</span>
              </div>
              <Link href={`/api/documents/${document.id}`} className="ghost-link" target="_blank">
                PDF
              </Link>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
