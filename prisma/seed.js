const {
  PrismaClient,
  AttendanceMethod,
  MemberStatus,
  PaymentProvider,
  PaymentStatus,
  EmailStatus,
  DocumentType,
  ExerciseSource,
  TrainerStatus,
  WorkoutStatus,
} = require("@prisma/client");
const ROLE = {
  ADMIN: "ADMIN",
};

const fs = require("node:fs");
const path = require("node:path");

function loadEnvIfMissing() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvIfMissing();

const prisma = new PrismaClient();

const trainerSeed = [
  ["Ana Zagar", "ana@fitnes-center.si", "Funkcionalni trening"],
  ["Miha Pirc", "miha@fitnes-center.si", "Moc in kondicija"],
  ["Sara Vidmar", "sara@fitnes-center.si", "Skupinske vadbe"],
  ["Tina Kolar", "tina@fitnes-center.si", "Mobilnost in core"],
];

const planSeed = [
  { name: "Starter", priceCents: 2900, durationDays: 30, description: "Dostop do fitnesa vsak dan do 15:00." },
  { name: "Core", priceCents: 4900, durationDays: 30, description: "Celodnevni dostop in 4 skupinski treningi mesecno." },
  { name: "Elite", priceCents: 6900, durationDays: 30, description: "Neomejeni skupinski treningi in prednostne rezervacije." },
];

const memberSeed = [
  "Matic Kranjc", "Nina Rozman", "Eva Bizjak", "Jan Kocjan", "Sara Kosec",
  "Vid Hribar", "Ana Ceh", "Luka Potocnik", "Nika Sever", "Urban Medic",
  "Maja Zagar", "Tim Rozic", "Tjasa Kotnik", "Rok Mlakar", "Lara Petek",
  "Zan Novak", "Klara Brin", "Nejc Furlan", "Masa Ster", "Jure Kos",
];

const exerciseSeed = [
  ["Goblet Squat", "Stabilna vaja za noge in trup.", "Noge"],
  ["Push Press", "Eksplozivni potisk nad glavo.", "Rame"],
  ["Cable Row", "Kontrolirana vlecna vaja za hrbet.", "Hrbet"],
  ["Dead Bug", "Vaja za stabilizacijo trupa.", "Core"],
  ["Walking Lunges", "Dinamicna vaja za ravnotezje in noge.", "Noge"],
  ["Assault Bike Intervals", "Intenzivni intervali za kondicijo.", "Kardio"],
];

async function main() {
  const trainers = await Promise.all(
    trainerSeed.map(([fullName, email, specialty], index) =>
      prisma.trainer.upsert({
        where: { email },
        update: {
          specialty,
          phone: `+38640${(111000 + index).toString().slice(-6)}`,
          bio: `${specialty} in personalni pristop k napredku.`,
          status: TrainerStatus.ACTIVE,
          startedAt: new Date(2025, 8, 1 + index),
        },
        create: {
          fullName,
          email,
          specialty,
          phone: `+38640${(111000 + index).toString().slice(-6)}`,
          bio: `${specialty} in personalni pristop k napredku.`,
          status: TrainerStatus.ACTIVE,
          startedAt: new Date(2025, 8, 1 + index),
        },
      }),
    ),
  );

  const plans = await Promise.all(
    planSeed.map((plan) =>
      prisma.subscriptionPlan.upsert({
        where: { name: plan.name },
        update: plan,
        create: plan,
      }),
    ),
  );

  const members = [];
  for (let index = 0; index < memberSeed.length; index += 1) {
    const fullName = memberSeed[index];
    const slug = fullName.toLowerCase().replace(/\s+/g, ".");
    const createdAt = new Date(2025, 7 + (index % 7), 3 + (index % 20));
    const status =
      index % 7 === 0 ? MemberStatus.EXPIRING : index % 9 === 0 ? MemberStatus.OVERDUE : MemberStatus.ACTIVE;

    const member = await prisma.member.upsert({
      where: { email: `${slug}@primer.si` },
      update: {
        fullName,
        phone: `+38641${(200000 + index).toString().slice(-6)}`,
        notes: index % 3 === 0 ? "Zeli kombinacijo utezi in skupinskih treningov." : null,
        status,
        joinedAt: createdAt,
        createdAt,
      },
      create: {
        fullName,
        email: `${slug}@primer.si`,
        phone: `+38641${(200000 + index).toString().slice(-6)}`,
        notes: index % 3 === 0 ? "Zeli kombinacijo utezi in skupinskih treningov." : null,
        status,
        createdAt,
      },
    });

    members.push(member);
  }

  let workouts = await prisma.workout.findMany();
  if (workouts.length === 0) {
    workouts = await Promise.all(
      Array.from({ length: 8 }).map((_, index) =>
        prisma.workout.create({
          data: {
            title: ["Jutranji HIIT", "Strength Base", "Core Flow", "Mobility Reset"][index % 4],
            scheduledAt: new Date(2026, 3, 14 + index, 7 + (index % 4) * 3, 0, 0),
            durationMin: 45 + (index % 3) * 15,
            capacity: 12 + (index % 4) * 2,
            level: ["BEGINNER", "INTERMEDIATE", "ADVANCED"][index % 3],
            status: WorkoutStatus.SCHEDULED,
            trainerId: trainers[index % trainers.length].id,
            description: "Skupinski termin za napredek v moci, kondiciji in mobilnosti.",
            location: index % 2 === 0 ? "Dvorana A" : "Dvorana B",
            type: ["HIIT", "Strength", "Mobility"][index % 3],
          },
        }),
      ),
    );
  }

  for (let index = 0; index < members.length; index += 1) {
    const member = members[index];
    const plan = plans[index % plans.length];
    const startDate = new Date(2026, 3, 1 + (index % 12));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const existingSubscription = await prisma.subscription.findFirst({
      where: { memberId: member.id, planId: plan.id },
    });

    const subscription = existingSubscription
      ? await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: { startDate, endDate, active: true, status: "ACTIVE" },
        })
      : await prisma.subscription.create({
          data: { memberId: member.id, planId: plan.id, startDate, endDate, active: true, status: "ACTIVE" },
        });

    const existingPayment = await prisma.payment.findFirst({
      where: { memberId: member.id, subscriptionId: subscription.id },
    });
    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          memberId: member.id,
          subscriptionId: subscription.id,
          amountCents: plan.priceCents,
          provider: PaymentProvider.MANUAL,
          status: index % 6 === 0 ? PaymentStatus.PENDING : PaymentStatus.PAID,
          description: `Placilo paketa ${plan.name}`,
          paidAt: index % 6 === 0 ? null : new Date(startDate),
        },
      });
    }

    if ((await prisma.document.count({ where: { subscriptionId: subscription.id } })) === 0) {
      await prisma.document.createMany({
        data: [
          {
            memberId: member.id,
            subscriptionId: subscription.id,
            type: DocumentType.MEMBERSHIP_CONFIRMATION,
            title: `Potrdilo - ${member.fullName}`,
            content: `Potrdilo za clanstvo ${member.fullName} na paketu ${plan.name}.`,
          },
          {
            memberId: member.id,
            subscriptionId: subscription.id,
            type: DocumentType.INVOICE,
            title: `Racun - ${member.fullName}`,
            content: `Mesecni racun za ${plan.name} v znesku ${plan.priceCents / 100} EUR.`,
          },
        ],
      });
    }

    if ((await prisma.emailLog.count({ where: { memberId: member.id } })) === 0) {
      await prisma.emailLog.create({
        data: {
          memberId: member.id,
          recipient: member.email,
          subject: index % 5 === 0 ? "Opomnik za obnovo narocnine" : "Dobrodosli v Fitnes Center",
          templateName: index % 5 === 0 ? "renewal-reminder" : "welcome",
          body: "Avtomatsko pripravljeno sporocilo iz seed podatkov.",
          status: EmailStatus.SENT,
          provider: "seed",
          sentAt: new Date(startDate),
        },
      });
    }
  }

  if ((await prisma.attendance.count()) === 0) {
    for (let index = 0; index < 30; index += 1) {
      await prisma.attendance.create({
        data: {
          memberId: members[index % members.length].id,
          workoutId: workouts[index % workouts.length].id,
          checkedInAt: new Date(2026, 3, 10 + (index % 5), 6 + (index % 10), 15, 0),
          method: AttendanceMethod.MANUAL,
        },
      });
    }
  }

  const attendanceCount = await prisma.attendance.count();
  if (attendanceCount < 220) {
    const extraAttendances = [];
    for (let index = 0; index < 240; index += 1) {
      const member = members[index % members.length];
      const checkedInAt = new Date(2025, 9 + (index % 7), 1 + (index % 27), 6 + (index % 12), 15, 0);
      extraAttendances.push({
        memberId: member.id,
        checkedInAt,
        method: index % 4 === 0 ? AttendanceMethod.PORTAL : AttendanceMethod.MANUAL,
      });
    }

    await prisma.attendance.createMany({
      data: extraAttendances,
      skipDuplicates: true,
    });
  }

  const paymentCount = await prisma.payment.count();
  if (paymentCount < 90) {
    const extraPayments = [];
    for (let index = 0; index < 120; index += 1) {
      const member = members[index % members.length];
      const plan = plans[index % plans.length];
      const createdAt = new Date(2025, 6 + (index % 9), 2 + (index % 24), 10, 30, 0);
      const isPending = index % 8 === 0;

      extraPayments.push({
        memberId: member.id,
        amountCents: plan.priceCents + (index % 3) * 500,
        provider: index % 5 === 0 ? PaymentProvider.STRIPE : PaymentProvider.MANUAL,
        status: isPending ? PaymentStatus.PENDING : PaymentStatus.PAID,
        description: `Zgodovinsko placilo ${plan.name} #${index + 1}`,
        paidAt: isPending ? null : createdAt,
        createdAt,
      });
    }

    await prisma.payment.createMany({
      data: extraPayments,
      skipDuplicates: false,
    });
  }

  await Promise.all(
    exerciseSeed.map(([name, description, targetArea]) =>
      prisma.exercise.upsert({
        where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        update: { description, targetArea, source: ExerciseSource.MANUAL },
        create: {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description,
          targetArea,
          source: ExerciseSource.MANUAL,
        },
      }),
    ),
  );

  if ((await prisma.importJob.count()) === 0) {
    await prisma.importJob.create({
      data: {
        fileName: "seed-members.xlsx",
        format: "XLSX",
        status: "COMPLETED",
        rowCount: members.length,
        note: "Zacetni demo podatki.",
      },
    });
  }

  if (!(await prisma.settings.findUnique({ where: { id: "default" } }))) {
    await prisma.settings.create({
      data: {
        id: "default",
        gymName: "Fitnes Center",
        email: "info@fitnes-center.si",
        phone: "+386 40 123 456",
        address: "Ljubljana, Slovenija",
        reminderDays: 7,
        currency: "EUR",
        smtpHost: "",
        smtpPort: null,
        smtpUser: "",
        smtpFrom: "fitnes-center@example.com",
      },
    });
  }

  const adminEmail = "admin@fitnes-center.si";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const crypto = require("node:crypto");
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync("admin123", salt, 64);
    const passwordHash = `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: ROLE.ADMIN,
      },
    });
  }

  console.log(`Seed completed with ${members.length} members available.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
