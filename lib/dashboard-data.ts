import { EmailStatus, PaymentStatus, type Prisma, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [
    memberCount,
    trainerCount,
    activeSubscriptions,
    expiredSubscriptions,
    todayAttendance,
    todayWorkouts,
    upcomingPayments,
    upcomingWorkouts,
    recentMembers,
    popularPlans,
    recentPayments,
  ] = await Promise.all([
    prisma.member.count({ where: { status: { not: "INACTIVE" } } }),
    prisma.trainer.count(),
    prisma.subscription.count({ where: { active: true, endDate: { gte: now } } }),
    prisma.subscription.count({ where: { endDate: { lt: now } } }),
    prisma.attendance.count({ where: { checkedInAt: { gte: startOfToday, lte: endOfToday } } }),
    prisma.workout.count({ where: { scheduledAt: { gte: startOfToday, lte: endOfToday } } }),
    prisma.subscription.count({
      where: { active: true, endDate: { gte: now, lte: inSevenDays } },
    }),
    prisma.workout.findMany({
      where: { scheduledAt: { gte: now } },
      include: { trainer: true, _count: { select: { attendances: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    prisma.member.findMany({
      include: {
        subscriptions: {
          where: { active: true },
          include: { plan: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { subscriptions: { _count: "desc" } },
      take: 4,
    }),
    prisma.payment.findMany({
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return {
    stats: [
      { label: "Aktivni clani", value: memberCount.toString(), detail: "Skupno registriranih v sistemu" },
      { label: "Aktivne narocnine", value: activeSubscriptions.toString(), detail: "Veljavne danes" },
      { label: "Potekle narocnine", value: expiredSubscriptions.toString(), detail: "Neveljavne" },
      { label: "Danesnja prisotnost", value: todayAttendance.toString(), detail: "Evidentirani prihodi" },
      { label: "Trenerji", value: trainerCount.toString(), detail: "Aktivna ekipa" },
      { label: "Danesnji treningi", value: todayWorkouts.toString(), detail: "Planirani termini" },
      { label: "Prihajajoca placila", value: upcomingPayments.toString(), detail: "Narocnine v 7 dneh" },
    ],
    upcomingWorkouts,
    recentMembers,
    popularPlans,
    recentPayments,
  };
}

export async function getMembersPageData(query?: { search?: string; status?: string; sort?: string }) {
  const where = {
    ...(query?.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: "insensitive" as const } },
            { email: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(query?.status ? { status: query.status as never } : {}),
  };

  const orderBy =
    query?.sort === "name"
      ? { fullName: "asc" as const }
      : query?.sort === "status"
        ? { status: "asc" as const }
        : { createdAt: "desc" as const };

  const [members, plans] = await Promise.all([
    prisma.member.findMany({
      where,
      include: {
        subscriptions: {
          where: { active: true },
          include: { plan: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
        _count: { select: { attendances: true, payments: true } },
      },
      orderBy,
    }),
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { priceCents: "asc" } }),
  ]);

  return { members, plans };
}

export async function getTrainersPageData() {
  return prisma.trainer.findMany({
    include: {
      _count: { select: { workouts: true } },
      workouts: { orderBy: { scheduledAt: "asc" }, take: 1 },
    },
    orderBy: { fullName: "asc" },
  });
}

export async function getWorkoutsPageData() {
  const [workouts, trainers, members] = await Promise.all([
    prisma.workout.findMany({
      include: {
        trainer: true,
        _count: { select: { attendances: true } },
        attendances: { include: { member: true }, orderBy: { checkedInAt: "desc" }, take: 5 },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.trainer.findMany({ orderBy: { fullName: "asc" } }),
    prisma.member.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return { workouts, trainers, members };
}

export async function getSubscriptionsPageData(query?: { sort?: string; status?: string }) {
  const now = new Date();
  const sortOrder =
    query?.sort === "price"
      ? { plan: { priceCents: "desc" as const } }
      : query?.sort === "member"
        ? { member: { fullName: "asc" as const } }
        : { endDate: "asc" as const };

  const [plans, members, subscriptions, payments] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { priceCents: "asc" },
    }),
    prisma.member.findMany({
      where: {
        subscriptions: { none: { active: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.subscription.findMany({
      where:
        query?.status === "expiring"
          ? { endDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } }
          : undefined,
      include: { member: true, plan: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: sortOrder,
    }),
    prisma.payment.findMany({
      include: { member: true, subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return { plans, members, subscriptions, payments };
}

export async function getActiveSubscriptionsPageData(query?: { status?: string }) {
  const now = new Date();
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);

  const where: Prisma.SubscriptionWhereInput =
    query?.status === "expiring"
      ? { active: true, endDate: { lte: inThirtyDays, gte: now } }
    : query?.status === "expired"
        ? { endDate: { lt: now } }
        : query?.status === "pending"
          ? { status: SubscriptionStatus.PENDING }
          : { active: true, endDate: { gte: now } };

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      member: true,
      plan: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { endDate: "asc" },
  });

  return {
    subscriptions: subscriptions.map((subscription) => ({
      ...subscription,
      payment: subscription.payments[0] ?? null,
    })),
  };
}

export async function getAnalyticsPageData() {
  const [attendances, members] = await Promise.all([
    prisma.attendance.findMany({ include: { workout: true } }),
    prisma.member.findMany({ select: { createdAt: true } }),
  ]);

  const visitByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const attendance of attendances) {
    visitByHour[new Date(attendance.checkedInAt).getHours()].count += 1;
  }

  const memberGrowthMap = new Map<string, number>();
  for (const member of members) {
    const key = member.createdAt.toISOString().slice(0, 10);
    memberGrowthMap.set(key, (memberGrowthMap.get(key) ?? 0) + 1);
  }

  const memberGrowth = [...memberGrowthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return { visitByHour, memberGrowth, attendanceCount: attendances.length };
}

export async function getAttendancePageData(query?: { member?: string; workout?: string }) {
  const where = {
    ...(query?.member ? { memberId: query.member } : {}),
    ...(query?.workout ? { workoutId: query.workout } : {}),
  };

  const [attendances, members, workouts] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: { member: true, workout: { include: { trainer: true } } },
      orderBy: { checkedInAt: "desc" },
      take: 60,
    }),
    prisma.member.findMany({ orderBy: { fullName: "asc" } }),
    prisma.workout.findMany({ include: { trainer: true }, orderBy: { scheduledAt: "asc" } }),
  ]);

  return { attendances, members, workouts };
}

export async function getUpcomingPaymentsData() {
  const now = new Date();
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);

  const subscriptions = await prisma.subscription.findMany({
    where: { active: true, endDate: { gte: now, lte: inThirtyDays } },
    include: {
      member: true,
      plan: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { endDate: "asc" },
  });

  return subscriptions;
}

export async function getImportPageData() {
  return prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 12 });
}

export async function getEmailPageData() {
  return prisma.emailLog.findMany({
    include: { member: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getDocumentsPageData() {
  return prisma.document.findMany({
    include: { member: true, subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getExercisesPageData() {
  return prisma.exercise.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getAdminOverviewForLanding() {
  const [plans, paymentsPending, emailsSent, documentsCount] = await Promise.all([
    prisma.subscriptionPlan.count(),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prisma.emailLog.count({ where: { status: EmailStatus.SENT } }),
    prisma.document.count(),
  ]);

  return { plans, paymentsPending, emailsSent, documentsCount };
}

export async function getMemberProfileData(id: string) {
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      subscriptions: {
        include: { plan: true, payments: { orderBy: { createdAt: "desc" } } },
        orderBy: { endDate: "desc" },
      },
      attendances: { include: { workout: { include: { trainer: true } } }, orderBy: { checkedInAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  return member;
}

export async function getTrainerProfileData(id: string) {
  const trainer = await prisma.trainer.findUnique({
    where: { id },
    include: {
      workouts: {
        include: { attendances: true },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  return trainer;
}

export async function getWorkoutProfileData(id: string) {
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      trainer: true,
      attendances: { include: { member: true }, orderBy: { checkedInAt: "desc" } },
    },
  });

  return workout;
}

export async function getSettingsData() {
  return prisma.settings.findUnique({ where: { id: "default" } });
}
