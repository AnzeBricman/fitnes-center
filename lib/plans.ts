export function getPlanFeatures(name: string, description: string | null, durationDays: number) {
  const baseFeatures = [
    `${durationDays} dni dostopa`,
    "Portal za rezervacije in pregled clanstva",
  ];

  if (name.toLowerCase().includes("starter")) {
    return [
      ...baseFeatures,
      "Dostop do fitnesa v dopoldanskem terminu",
      "Odlicno za zacetek in uvajanje rutine",
      "Najbolj ugodna mesecna izbira",
    ];
  }

  if (name.toLowerCase().includes("core")) {
    return [
      ...baseFeatures,
      "Celodnevni dostop do fitnes centra",
      "Vkljuceni skupinski treningi",
      "Najboljse razmerje med ceno in ponudbo",
    ];
  }

  if (name.toLowerCase().includes("elite")) {
    return [
      ...baseFeatures,
      "Neomejeni skupinski treningi",
      "Prednostne rezervacije terminov",
      "Najvec ugodnosti za redne clane",
    ];
  }

  return [
    ...baseFeatures,
    description ?? "Paket za reden napredek in pregledno vadbo.",
    "Prilagodljiv dostop glede na izbran plan",
  ];
}

export function getPlanHighlight(name: string, index: number) {
  if (name.toLowerCase().includes("elite")) return "Premium";
  if (name.toLowerCase().includes("core")) return "Priporoceno";
  if (name.toLowerCase().includes("starter")) return "Zacetek";
  return index === 1 ? "Priporoceno" : "Paket";
}
