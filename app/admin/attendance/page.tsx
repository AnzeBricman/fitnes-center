import { createAttendance } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getAttendancePageData } from "@/lib/dashboard-data";
import { formatDateTime, formatLabel } from "@/lib/utils";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams?: Promise<{ member?: string; workout?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { attendances, members, workouts } = await getAttendancePageData(params);

  return (
    <DashboardShell
      title="Prisotnost"
      description="Evidenca obiskov in rocni vnos prihodov v fitnes center."
    >
      <section className="content-layout">
        <article className="panel-card form-card">
          <div className="panel-card-header"><div><span className="section-kicker">Vnos</span><h3>Dodaj prisotnost</h3></div></div>
          <form action={createAttendance} className="admin-form">
            <label className="form-span-2">
              <span>Clan</span>
              <select name="memberId" required defaultValue="">
                <option value="" disabled>Izberi clana</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
              </select>
            </label>
            <label className="form-span-2">
              <span>Trening (neobvezno)</span>
              <select name="workoutId" defaultValue="">
                <option value="">Samostojni obisk</option>
                {workouts.map((workout) => (
                  <option key={workout.id} value={workout.id}>
                    {workout.title} - {workout.trainer.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Nacin</span>
              <select name="method" defaultValue="MANUAL">
                <option value="MANUAL">Rocno</option>
                <option value="TERMINAL">Terminal</option>
                <option value="PORTAL">Portal clana</option>
              </select>
            </label>
            <label>
              <span>Cas prihoda</span>
              <input type="datetime-local" name="checkedInAt" />
            </label>
            <button className="primary-button" type="submit">Shrani prihod</button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Filtri</span><h3>Iskanje prisotnosti</h3></div></div>
          <form className="filter-form" method="get">
            <select name="member" defaultValue={params.member || ""}>
              <option value="">Vsi clani</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
            </select>
            <select name="workout" defaultValue={params.workout || ""}>
              <option value="">Vsi treningi</option>
              {workouts.map((workout) => <option key={workout.id} value={workout.id}>{workout.title}</option>)}
            </select>
            <button className="ghost-link" type="submit">Filtriraj</button>
          </form>

          <div className="table-list">
            {attendances.map((attendance) => (
              <div key={attendance.id} className="table-row">
                <div>
                  <strong>{attendance.member.fullName}</strong>
                  <span>
                    {attendance.workout
                      ? `${attendance.workout.title} - ${attendance.workout.trainer.fullName}`
                      : "Samostojni obisk"}
                  </span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatLabel(attendance.method)}</strong>
                  <span>{formatDateTime(attendance.checkedInAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
