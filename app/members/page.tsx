import { DashboardShell } from "@/components/dashboard-shell";
import { members } from "@/lib/mock-data";

export default function MembersPage() {
  return (
    <DashboardShell
      title="Clani"
      description="Pregled aktivnih clanov, statusa clanstva in naslednjih placil."
    >
      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Members</span>
            <h3>Seznam clanov</h3>
          </div>
          <button type="button" className="ghost-link">
            Dodaj clana
          </button>
        </div>

        <div className="table-list">
          {members.map((member) => (
            <div key={member.name} className="table-row">
              <div>
                <strong>{member.name}</strong>
                <span>Paket: {member.plan}</span>
              </div>
              <div>
                <strong>{member.status}</strong>
                <span>Placilo: {member.nextPayment}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
