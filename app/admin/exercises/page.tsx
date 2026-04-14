import { syncExercises } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getExercisesPageData } from "@/lib/dashboard-data";
import { formatLabel } from "@/lib/utils";

export default async function ExercisesPage() {
  const exercises = await getExercisesPageData();

  return (
    <DashboardShell
      title="Vaje in API"
      description="Knjižnica vaj z opisi, slikami in moznostjo sinhronizacije iz zunanjega API."
      actions={
        <form action={syncExercises}>
          <button className="ghost-link" type="submit">Sinhroniziraj iz API</button>
        </form>
      }
    >
      <section className="exercise-grid">
        {exercises.map((exercise) => (
          <article key={exercise.id} className="exercise-card">
            {exercise.imageUrl ? <img src={exercise.imageUrl} alt={exercise.name} /> : null}
            <div>
              <span className="section-kicker">{formatLabel(exercise.source)}</span>
              <h3>{exercise.name}</h3>
              <p>{exercise.description}</p>
              <small>{exercise.targetArea}</small>
            </div>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}
