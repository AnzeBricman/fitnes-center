import { EmailStatus, PaymentProvider, PaymentStatus, type Prisma, SubscriptionStatus } from "@prisma/client";
import { getAnalyticsPeriod, getRangeStart, type AnalyticsPeriod } from "@/lib/analytics-period";
import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildAttendanceTrend(
  attendances: Array<{ checkedInAt: Date }>,
  period: AnalyticsPeriod,
  rangeStart: Date,
  now: Date,
) {
  if (period === "day") {
    const map = new Map<string, number>();
    for (let hour = 0; hour < 24; hour += 1) {
      map.set(`${String(hour).padStart(2, "0")}:00`, 0);
    }

    for (const attendance of attendances) {
      const key = `${String(attendance.checkedInAt.getHours()).padStart(2, "0")}:00`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return [...map.entries()].map(([date, count]) => ({ date, count }));
  }

  if (period === "year") {
    const map = new Map<string, number>();
    const seed = new Date(rangeStart);
    for (let index = 0; index < 12; index += 1) {
      map.set(formatMonthKey(seed), 0);
      seed.setMonth(seed.getMonth() + 1, 1);
    }

    for (const attendance of attendances) {
      const key = formatMonthKey(attendance.checkedInAt);
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return [...map.entries()].map(([date, count]) => ({ date, count }));
  }

  const totalDays = period === "week" ? 7 : 30;
  const map = new Map<string, number>();
  for (let index = 0; index < totalDays; index += 1) {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    map.set(date.toISOString().slice(0, 10), 0);
  }

  for (const attendance of attendances) {
    const key = attendance.checkedInAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()].map(([date, count]) => ({ date, count }));
}

function buildRevenueTrend(
  payments: Array<{ createdAt: Date; amountCents: number }>,
  period: AnalyticsPeriod,
  rangeStart: Date,
) {
  if (period === "day") {
    const map = new Map<string, number>();
    for (let hour = 0; hour < 24; hour += 1) {
      map.set(`${String(hour).padStart(2, "0")}:00`, 0);
    }

    for (const payment of payments) {
      const key = `${String(payment.createdAt.getHours()).padStart(2, "0")}:00`;
      map.set(key, (map.get(key) ?? 0) + payment.amountCents);
    }

    return [...map.entries()].map(([week, amountCents]) => ({ week, amountCents }));
  }

  if (period === "year") {
    const map = new Map<string, number>();
    const seed = new Date(rangeStart);
    for (let index = 0; index < 12; index += 1) {
      map.set(formatMonthKey(seed), 0);
      seed.setMonth(seed.getMonth() + 1, 1);
    }

    for (const payment of payments) {
      const key = formatMonthKey(payment.createdAt);
      map.set(key, (map.get(key) ?? 0) + payment.amountCents);
    }

    return [...map.entries()].map(([week, amountCents]) => ({ week, amountCents }));
  }

  const map = new Map<string, number>();
  const totalDays = period === "week" ? 7 : 30;
  for (let index = 0; index < totalDays; index += 1) {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    map.set(date.toISOString().slice(0, 10), 0);
  }

  for (const payment of payments) {
    const key = payment.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + payment.amountCents);
  }

  return [...map.entries()].map(([week, amountCents]) => ({ week, amountCents }));
}

export async function getDashboardData(input?: { period?: string }) {
  const period = getAnalyticsPeriod(input?.period);
  const now = new Date();
  const rangeStart = getRangeStart(period, now);
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const startOfToday = startOfDay(now);
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
    activeMemberCount,
    expiringMemberCount,
    overdueMemberCount,
    inactiveMemberCount,
    pendingPaymentsCount,
    paidPaymentsCount,
    emailSentCount,
    documentCount,
    apiExerciseCount,
    attendanceWindow,
    revenueWindow,
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
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.count({ where: { status: "EXPIRING" } }),
    prisma.member.count({ where: { status: "OVERDUE" } }),
    prisma.member.count({ where: { status: "INACTIVE" } }),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
    prisma.emailLog.count({ where: { status: EmailStatus.SENT } }),
    prisma.document.count(),
    prisma.exercise.count({ where: { source: "API" } }),
    prisma.attendance.findMany({
      where: { checkedInAt: { gte: rangeStart, lte: endOfToday } },
      select: { checkedInAt: true },
    }),
    prisma.payment.findMany({
      where: {
        createdAt: { gte: rangeStart },
        status: PaymentStatus.PAID,
      },
      select: { createdAt: true, amountCents: true },
    }),
  ]);

  const attendanceTrend = buildAttendanceTrend(attendanceWindow, period, rangeStart, now);
  const revenueTrend = buildRevenueTrend(revenueWindow, period, rangeStart);

  return {
    period,
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
    memberStatus: [
      { label: "Aktivni", value: activeMemberCount, tone: "success" },
      { label: "Potece kmalu", value: expiringMemberCount, tone: "warning" },
      { label: "Placilo zamuja", value: overdueMemberCount, tone: "danger" },
      { label: "Neaktivni", value: inactiveMemberCount, tone: "muted" },
    ],
    paymentStatus: [
      { label: "Placano", value: paidPaymentsCount, tone: "success" },
      { label: "V cakanju", value: pendingPaymentsCount, tone: "warning" },
    ],
    operations: [
      { label: "Poslani emaili", value: emailSentCount, detail: "Komunikacija s strankami" },
      { label: "PDF dokumenti", value: documentCount, detail: "Racuni in potrdila" },
      { label: "API vaje", value: apiExerciseCount, detail: "Podatki iz zunanjega API" },
      { label: "Prihajajoca placila", value: upcomingPayments, detail: "Clanom se bliza potek" },
    ],
    attendanceTrend,
    revenueTrend,
  };
}

export async function getMembersPageData(query?: {
  search?: string;
  status?: string;
  sort?: string;
  planId?: string;
}) {
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
    ...(query?.planId
      ? {
          subscriptions: {
            some: {
              planId: query.planId,
              active: true,
            },
          },
        }
      : {}),
  };

  const orderBy =
    query?.sort === "name"
      ? { fullName: "asc" as const }
      : query?.sort === "status"
        ? { status: "asc" as const }
        : query?.sort === "joined"
          ? { joinedAt: "desc" as const }
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

export async function getSubscriptionsPageData(query?: {
  sort?: string;
  status?: string;
  search?: string;
  paymentStatus?: string;
  provider?: string;
}) {
  const now = new Date();
  const sortOrder =
    query?.sort === "price"
      ? { plan: { priceCents: "desc" as const } }
      : query?.sort === "member"
        ? { member: { fullName: "asc" as const } }
        : query?.sort === "payment"
          ? { payments: { _count: "desc" as const } }
        : { endDate: "asc" as const };

  const where: Prisma.SubscriptionWhereInput = {
    ...(query?.status === "expiring"
      ? { endDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } }
      : query?.status === "cancelled"
        ? { status: SubscriptionStatus.CANCELLED }
        : query?.status === "expired"
          ? { status: SubscriptionStatus.EXPIRED }
          : query?.status === "pending"
            ? { status: SubscriptionStatus.PENDING }
            : {}),
    ...(query?.search
      ? {
          OR: [
            { member: { fullName: { contains: query.search, mode: "insensitive" } } },
            { member: { email: { contains: query.search, mode: "insensitive" } } },
            { plan: { name: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...((query?.paymentStatus || query?.provider)
      ? {
          payments: {
            some: {
              ...(query?.paymentStatus ? { status: query.paymentStatus as PaymentStatus } : {}),
              ...(query?.provider ? { provider: query.provider as PaymentProvider } : {}),
            },
          },
        }
      : {}),
  };

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
      where,
      include: { member: true, plan: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: sortOrder,
    }),
    prisma.payment.findMany({
      include: { member: true, subscription: { include: { plan: true } } },
      where: {
        ...(query?.search
          ? {
              OR: [
                { member: { fullName: { contains: query.search, mode: "insensitive" } } },
                { description: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(query?.paymentStatus ? { status: query.paymentStatus as PaymentStatus } : {}),
        ...(query?.provider ? { provider: query.provider as PaymentProvider } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 24,
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

export async function getAnalyticsPageData(input?: { period?: string }) {
  const period = getAnalyticsPeriod(input?.period);
  const now = new Date();
  const rangeStart = getRangeStart(period, now);

  const [attendances, members, subscriptions, payments] = await Promise.all([
    prisma.attendance.findMany({
      where: { checkedInAt: { gte: rangeStart, lte: now } },
      include: { workout: true },
    }),
    prisma.member.findMany({
      where: { createdAt: { gte: rangeStart, lte: now } },
      select: { createdAt: true },
    }),
    prisma.subscription.findMany({ select: { status: true, endDate: true } }),
    prisma.payment.findMany({
      where: { createdAt: { gte: rangeStart, lte: now } },
      select: { provider: true, status: true, amountCents: true, createdAt: true },
    }),
  ]);

  const visitByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const attendance of attendances) {
    visitByHour[new Date(attendance.checkedInAt).getHours()].count += 1;
  }

  const memberGrowthMap = new Map<string, number>();
  for (const member of members) {
    const key =
      period === "year"
        ? formatMonthKey(member.createdAt)
        : member.createdAt.toISOString().slice(0, 10);
    memberGrowthMap.set(key, (memberGrowthMap.get(key) ?? 0) + 1);
  }

  const memberGrowthSeed = new Map<string, number>();
  if (period === "year") {
    const seed = new Date(rangeStart);
    for (let index = 0; index < 12; index += 1) {
      memberGrowthSeed.set(formatMonthKey(seed), 0);
      seed.setMonth(seed.getMonth() + 1, 1);
    }
  } else {
    const totalDays = period === "day" ? 1 : period === "week" ? 7 : 30;
    for (let index = 0; index < totalDays; index += 1) {
      const date = new Date(rangeStart);
      date.setDate(rangeStart.getDate() + index);
      memberGrowthSeed.set(date.toISOString().slice(0, 10), 0);
    }
  }

  for (const [key, count] of memberGrowthMap.entries()) {
    memberGrowthSeed.set(key, count);
  }

  const memberGrowth = [...memberGrowthSeed.entries()].map(([date, count]) => ({ date, count }));

  const subscriptionStatusMap = new Map<string, number>([
    ["ACTIVE", 0],
    ["EXPIRED", 0],
    ["CANCELLED", 0],
    ["PENDING", 0],
  ]);

  for (const subscription of subscriptions) {
    subscriptionStatusMap.set(subscription.status, (subscriptionStatusMap.get(subscription.status) ?? 0) + 1);
  }

  const subscriptionStatus = [...subscriptionStatusMap.entries()].map(([status, count]) => ({
    status,
    count,
  }));

  const providerMap = new Map<string, { count: number; amountCents: number }>();
  for (const payment of payments) {
    const current = providerMap.get(payment.provider) ?? { count: 0, amountCents: 0 };
    providerMap.set(payment.provider, {
      count: current.count + 1,
      amountCents: current.amountCents + payment.amountCents,
    });
  }

  const paymentProviders = [...providerMap.entries()].map(([provider, value]) => ({
    provider,
    ...value,
  }));

  const monthlyRevenueMap = new Map<string, number>();
  for (const payment of payments) {
    if (payment.status !== PaymentStatus.PAID) continue;
    const month =
      period === "year"
        ? formatMonthKey(payment.createdAt)
        : payment.createdAt.toISOString().slice(0, 10);
    monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) ?? 0) + payment.amountCents);
  }

  const revenueSeed = new Map<string, number>();
  if (period === "year") {
    const seed = new Date(rangeStart);
    for (let index = 0; index < 12; index += 1) {
      revenueSeed.set(formatMonthKey(seed), 0);
      seed.setMonth(seed.getMonth() + 1, 1);
    }
  } else {
    const totalDays = period === "day" ? 1 : period === "week" ? 7 : 30;
    for (let index = 0; index < totalDays; index += 1) {
      const date = new Date(rangeStart);
      date.setDate(rangeStart.getDate() + index);
      revenueSeed.set(date.toISOString().slice(0, 10), 0);
    }
  }

  for (const [key, amountCents] of monthlyRevenueMap.entries()) {
    revenueSeed.set(key, amountCents);
  }

  const revenueByMonth = [...revenueSeed.entries()].map(([month, amountCents]) => ({ month, amountCents }));

  return {
    period,
    visitByHour,
    memberGrowth,
    attendanceCount: attendances.length,
    subscriptionStatus,
    paymentProviders,
    revenueByMonth,
  };
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
