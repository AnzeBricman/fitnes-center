import { DashboardShell } from "@/components/dashboard-shell";
import { workouts } from "@/lib/mock-data";

export default function WorkoutsPage() {
  return (
    <DashboardShell
      title="Treningi"
      description="Urejanje urnika treningov, kapacitet in razporeditve trenerjev."
    >
      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <span className="section-kicker">Schedule</span>
            <h3>Dnevni termini</h3>
          </div>
          <button type="button" className="ghost-link">
            Nov termin
          </button>
        </div>

        <div className="table-list">
          {workouts.map((workout) => (
            <div key={workout.title} className="table-row">
              <div>
                <strong>{workout.title}</strong>
                <span>Trener: {workout.coach}</span>
              </div>
              <div>
                <strong>{workout.time}</strong>
                <span>Zasedenost: {workout.capacity}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
