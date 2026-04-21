export const navigation = [
  {
    title: "Pregled",
    items: [
      { href: "/admin", label: "Dashboard", description: "Glavni pregled poslovanja" },
      { href: "/admin/analytics", label: "Analitika", description: "Obisk, rast in prihodki" },
    ],
  },
  {
    title: "Operativa",
    items: [
      { href: "/admin/members", label: "Clani", description: "Baza clanov in statusi" },
      { href: "/admin/trainers", label: "Trenerji", description: "Ekipa in specializacije" },
      { href: "/admin/workouts", label: "Treningi", description: "Urnik in kapacitete" },
      { href: "/admin/attendance", label: "Prisotnost", description: "Evidenca prihodov" },
      { href: "/admin/subscriptions", label: "Narocnine", description: "Paketi in placila" },
      { href: "/admin/active-subscriptions", label: "Aktivne narocnine", description: "Statusi in podaljsanja" },
      { href: "/admin/upcoming-payments", label: "Prihajajoca placila", description: "Poteki in opomniki" },
    ],
  },
  {
    title: "Komunikacija",
    items: [
      { href: "/admin/emails", label: "Email", description: "Obvestila in opomniki" },
      { href: "/admin/documents", label: "PDF", description: "Potrdila in racuni" },
      { href: "/admin/settings", label: "Nastavitve", description: "Osnovni podatki sistema" },
    ],
  },
  {
    title: "Vsebina",
    items: [
      { href: "/admin/exercises", label: "Vaje", description: "API katalog in opisi" },
    ],
  },
] as const;
