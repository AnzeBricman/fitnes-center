import { checkInAttendance, createWorkout, deleteWorkout } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getWorkoutsPageData } from "@/lib/dashboard-data";
import { formatDateTime, formatLabel, toInputDateTimeValue } from "@/lib/utils";

export default async function WorkoutsPage() {
  const { workouts, trainers, members } = await getWorkoutsPageData();

  return (
    <DashboardShell
      title="Treningi"
      description="CRUD za urnik, kapacitete in evidenco prisotnosti clanov."
    >
      <section className="content-layout">
        <article className="panel-card form-card">
          <div className="panel-card-header"><div><span className="section-kicker">Nov trening</span><h3>Ustvari termin</h3></div></div>
          <form action={createWorkout} className="admin-form">
            <label><span>Naziv</span><input name="title" required /></label>
            <label>
              <span>Trener</span>
              <select name="trainerId" required defaultValue="">
                <option value="" disabled>Izberi trenerja</option>
                {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.fullName}</option>)}
              </select>
            </label>
            <label><span>Zacetek</span><input type="datetime-local" name="scheduledAt" defaultValue={toInputDateTimeValue(new Date())} required /></label>
            <label><span>Trajanje</span><input type="number" name="durationMin" defaultValue="60" required /></label>
            <label><span>Kapaciteta</span><input type="number" name="capacity" defaultValue="16" required /></label>
            <label>
              <span>Nivo</span>
              <select name="level" defaultValue="BEGINNER">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </label>
            <label className="form-span-2"><span>Opis</span><textarea rows={4} name="description" /></label>
            <button type="submit" className="primary-button">Shrani trening</button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Prisotnost</span><h3>Evidenca obiskov</h3></div></div>
          <form action={checkInAttendance} className="admin-form compact-form">
            <label>
              <span>Clan</span>
              <select name="memberId" required defaultValue="">
                <option value="" disabled>Izberi clana</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
              </select>
            </label>
            <label>
              <span>Trening</span>
              <select name="workoutId" required defaultValue="">
                <option value="" disabled>Izberi trening</option>
                {workouts.map((workout) => <option key={workout.id} value={workout.id}>{workout.title}</option>)}
              </select>
            </label>
            <button type="submit" className="ghost-link">Oznaci prisotnost</button>
          </form>

          <div className="table-list">
            {workouts.map((workout) => (
              <div key={workout.id} className="table-row table-row-actions">
                <div>
                  <strong>{workout.title}</strong>
                  <span>{workout.trainer.fullName} · {formatDateTime(workout.scheduledAt)}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{workout._count.attendances}/{workout.capacity}</strong>
                  <span>{formatLabel(workout.level)} · {workout.durationMin} min</span>
                </div>
                <form action={deleteWorkout}>
                  <input type="hidden" name="id" value={workout.id} />
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
