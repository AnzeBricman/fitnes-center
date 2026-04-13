import { DashboardShell } from "@/components/dashboard-shell";
import { trainers } from "@/lib/mock-data";

export default function TrainersPage() {
  return (
    <DashboardShell
      title="Trenerji"
      description="Pregled trenerjev, specializacij in tedenskega urnika."
    >
      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Coaches</span>
            <h3>Ekipa trenerjev</h3>
          </div>
          <button type="button" className="ghost-link">
            Dodaj trenerja
          </button>
        </div>

        <div className="table-list">
          {trainers.map((trainer) => (
            <div key={trainer.name} className="table-row">
              <div>
                <strong>{trainer.name}</strong>
                <span>{trainer.focus}</span>
              </div>
              <div>
                <strong>{trainer.schedule}</strong>
                <span>Urnik</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
