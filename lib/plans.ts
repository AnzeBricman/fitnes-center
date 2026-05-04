export function getPlanFeatures(name: string, description: string | null, durationDays: number) {
  const baseFeatures = [
    `${durationDays} dni dostopa`,
    "Portal za rezervacije in pregled clanstva",
  ];

  if (name.toLowerCase().includes("starter")) {
    return [
      ...baseFeatures,
      "Dostop do fitnesa v dopoldanskem terminu",
      "Brez rezervacij skupinskih treningov",
      "Brez rezervacije osebnega trenerja",
      "Pregled trenerjev in lastnega racuna",
    ];
  }

  if (name.toLowerCase().includes("core")) {
    return [
      ...baseFeatures,
      "Celodnevni dostop do fitnes centra",
      "4 rezervacije skupinskih treningov v obdobju narocnine",
      "Pregled vseh trenerjev in njihovih terminov",
      "Brez rezervacije osebnega trenerja",
      "Najboljse razmerje med ceno in ponudbo",
    ];
  }

  if (name.toLowerCase().includes("elite")) {
    return [
      ...baseFeatures,
      "Neomejene rezervacije skupinskih treningov",
      "Rezervacija osebnega trenerja, ce je trener prost",
      "Pregled in preklic osebnih terminov v racunu",
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
