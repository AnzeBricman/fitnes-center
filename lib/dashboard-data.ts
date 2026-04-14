import { EmailStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const [
    memberCount,
    trainerCount,
    activeSubscriptions,
    upcomingPayments,
    upcomingWorkouts,
    recentMembers,
    popularPlans,
    recentPayments,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.trainer.count(),
    prisma.subscription.count({ where: { active: true, endDate: { gte: now } } }),
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
      include: { subscription: { include: { plan: true } } },
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
      { label: "Trenerji", value: trainerCount.toString(), detail: "Aktivna ekipa" },
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
        subscription: { include: { plan: true } },
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
      where: { subscription: { is: null } },
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
