export const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/members", label: "Clani" },
  { href: "/trainers", label: "Trenerji" },
  { href: "/workouts", label: "Treningi" },
  { href: "/subscriptions", label: "Narocnine" },
];

export const dashboardStats = [
  { label: "Aktivne narocnine", value: "248", detail: "+12 ta mesec" },
  { label: "Prisotnost danes", value: "64", detail: "najvec ob 18:00" },
  { label: "Aktivni trenerji", value: "9", detail: "3 skupinski termini" },
  { label: "Placila kmalu", value: "18", detail: "v naslednjih 7 dneh" },
];

export const alerts = [
  "7 narocnin potece v naslednjih 3 dneh.",
  "2 trenerja se nimata potrjenega urnika za petek.",
  "CSV uvoz za marec caka na pregled admina.",
];

export const members = [
  { name: "Matic Kranjc", plan: "Premium", status: "Aktiven", nextPayment: "12 Apr" },
  { name: "Nina Rozman", plan: "Skupinski", status: "Aktiven", nextPayment: "14 Apr" },
  { name: "Eva Bizjak", plan: "Student", status: "Potece kmalu", nextPayment: "09 Apr" },
  { name: "Jan Kocjan", plan: "Premium", status: "Zamuda", nextPayment: "05 Apr" },
];

export const trainers = [
  { name: "Ana Zagar", focus: "Funkcionalni trening", schedule: "Pon, Sre, Pet" },
  { name: "Miha Pirc", focus: "Moc in kondicija", schedule: "Tor, Cet" },
  { name: "Sara Vidmar", focus: "Skupinske vadbe", schedule: "Pon do Sob" },
];

export const workouts = [
  { title: "Jutranji HIIT", coach: "Ana Zagar", time: "07:00", capacity: "12/16" },
  { title: "Strength Base", coach: "Miha Pirc", time: "17:00", capacity: "9/12" },
  { title: "Core Flow", coach: "Sara Vidmar", time: "19:00", capacity: "15/18" },
];

export const subscriptions = [
  { plan: "Basic", price: "29 EUR", duration: "30 dni", members: "68 aktivnih" },
  { plan: "Premium", price: "49 EUR", duration: "30 dni", members: "104 aktivnih" },
  { plan: "Student", price: "25 EUR", duration: "30 dni", members: "41 aktivnih" },
  { plan: "Group Plus", price: "59 EUR", duration: "30 dni", members: "35 aktivnih" },
];
