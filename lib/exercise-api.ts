type ExerciseApiItem = {
  name: string;
  description: string;
  imageUrl?: string;
  targetArea: string;
  externalId?: string;
};

const fallbackExercises: ExerciseApiItem[] = [
  {
    name: "Goblet Squat",
    description: "Stabilna vaja za noge in trup z dumbbell ali kettlebell utezo.",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
    targetArea: "Noge",
    externalId: "fallback-goblet-squat",
  },
  {
    name: "Push Press",
    description: "Eksplozivni potisk nad glavo, primeren za razvoj moci ramen in trupa.",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    targetArea: "Rame",
    externalId: "fallback-push-press",
  },
  {
    name: "Cable Row",
    description: "Kontrolirana vlecna vaja za hrbet in stabilnost lopatic.",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    targetArea: "Hrbet",
    externalId: "fallback-cable-row",
  },
];

export async function fetchExercisesFromApi() {
  const apiUrl = process.env.EXERCISE_API_URL;

  if (!apiUrl) {
    return fallbackExercises;
  }

  const response = await fetch(apiUrl, {
    headers: process.env.EXERCISE_API_KEY
      ? { Authorization: `Bearer ${process.env.EXERCISE_API_KEY}` }
      : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Exercise API returned ${response.status}`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];

  return items
    .slice(0, 12)
    .map((item: Record<string, unknown>, index: number) => ({
      name: String(item.name ?? `Exercise ${index + 1}`),
      description: String(item.description ?? item.instructions ?? "Opis ni na voljo."),
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
      targetArea: String(item.targetArea ?? item.category ?? "Splošno"),
      externalId: String(item.id ?? `api-${index}`),
    }));
}
