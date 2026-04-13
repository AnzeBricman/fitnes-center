# Fitnes Center

Spletna aplikacija za upravljanje fitnes centra v `Next.js`, namenjena vodenju clanov, trenerjev, treningov, narocnin in osnovne administracije.

## Jedro ideje

Projekt bo zgrajen kot moderna spletna aplikacija z `Next.js App Router`, kjer bo:

- admin upravljal clane, trenerje, treninge in narocnine
- osebje spremljalo prisotnost in prihajajoce obveznosti
- sistem pripravljal osnovne statistike obiska in rasti
- aplikacija podpirala uvoz podatkov, email obvestila in PDF izvoz

## Plan funkcionalnosti

### CRUD moduli
- clani
- trenerji
- treningi
- narocnine

### Admin panel
- pregled aktivnih narocnin
- evidenca prisotnosti
- prihajajoca placila
- filtri in sortiranje

### Analitika
- obisk po dnevih in urah
- rast stevila clanov

### Dodatki
- uvoz CSV ali Excel datotek
- email opomniki in obvestila
- PDF potrdila in racuni
- povezava z zunanjim API za opise vaj in slike

## Tehnologije

- `Next.js`
- `React`
- `TypeScript`
- `CSS`
- `Prisma` ali `Drizzle` za dostop do baze
- `MySQL` ali `PostgreSQL`

## Zacetek razvoja

1. Namesti odvisnosti:
   ```bash
   npm install
   ```
2. Nastavi lokalne spremenljivke:
   ```bash
   copy .env.example .env.local
   ```
3. V `.env.local` dodaj svoj Neon `DATABASE_URL`.
4. Generiraj Prisma client in pripravi bazo:
   ```bash
   npm run db:generate
   npm run db:push
   ```
5. Zazeni razvojni streznik:
   ```bash
   npm run dev
   ```
6. Odpri:
   ```bash
   http://localhost:3000
   ```

## Trenutno stanje

Repo vsebuje zacetni `Next.js` skelet in landing/dashboard zasnovo, ki sluzi kot osnova za nadaljnji razvoj modulov.

## Baza

Projekt je pripravljen za `PostgreSQL` oziroma `Neon` prek `Prisma`.
Zacetni modeli:

- `Member`
- `Trainer`
- `Workout`
- `SubscriptionPlan`
- `Subscription`
- `Attendance`
