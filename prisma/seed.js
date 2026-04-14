const {
  PrismaClient,
  MemberStatus,
  PaymentProvider,
  PaymentStatus,
  EmailStatus,
  DocumentType,
  ExerciseSource,
} = require("@prisma/client");

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
  const existingMembers = await prisma.member.count();
  if (existingMembers >= 20) {
    console.log("Database already contains at least 20 members. Skipping seed.");
    return;
  }

  const trainers = await Promise.all(
    trainerSeed.map(([fullName, email, specialty], index) =>
      prisma.trainer.upsert({
        where: { email },
        update: {
          specialty,
          phone: `+38640${(111000 + index).toString().slice(-6)}`,
          bio: `${specialty} in personalni pristop k napredku.`,
        },
        create: {
          fullName,
          email,
          specialty,
          phone: `+38640${(111000 + index).toString().slice(-6)}`,
          bio: `${specialty} in personalni pristop k napredku.`,
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
    const createdAt = new Date(2026, 2, 1 + index);
    const status =
      index % 7 === 0 ? MemberStatus.EXPIRING : index % 9 === 0 ? MemberStatus.OVERDUE : MemberStatus.ACTIVE;

    const member = await prisma.member.upsert({
      where: { email: `${slug}@primer.si` },
      update: {
        fullName,
        phone: `+38641${(200000 + index).toString().slice(-6)}`,
        notes: index % 3 === 0 ? "Zeli kombinacijo utezi in skupinskih treningov." : null,
        status,
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
            trainerId: trainers[index % trainers.length].id,
            description: "Skupinski termin za napredek v moci, kondiciji in mobilnosti.",
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

    const subscription = await prisma.subscription.upsert({
      where: { memberId: member.id },
      update: { planId: plan.id, startDate, endDate, active: true },
      create: { memberId: member.id, planId: plan.id, startDate, endDate, active: true },
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
        },
      });
    }
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
