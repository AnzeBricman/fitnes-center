"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DocumentType,
  EmailStatus,
  ExerciseSource,
  ImportStatus,
  Gender,
  MemberStatus,
  AttendanceMethod,
  PaymentProvider,
  PaymentStatus,
  SubscriptionStatus,
  WorkoutLevel,
  WorkoutStatus,
  TrainerStatus,
} from "@prisma/client";
import { sendEmailMessage } from "@/lib/email";
import { fetchExercisesFromApi } from "@/lib/exercise-api";
import { prisma } from "@/lib/prisma";
import { ROLE } from "@/lib/roles";
import { getBaseUrl, getStripe } from "@/lib/stripe";
import { createSession, hashPassword, verifyPassword, clearSession } from "@/lib/auth";
import { cookies } from "next/headers";

function getString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? value : null;
}

function getInt(formData: FormData, key: string) {
  return Number.parseInt(getString(formData, key), 10);
}

function getDecimalCents(formData: FormData, key: string) {
  return Math.round(Number.parseFloat(getString(formData, key)) * 100);
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? new Date(value) : null;
}

function getDate(formData: FormData, key: string) {
  const value = getOptionalDate(formData, key);
  return value ?? new Date(NaN);
}

function adminPaths() {
  return [
    "/admin",
    "/admin/members",
    "/admin/trainers",
    "/admin/workouts",
    "/admin/subscriptions",
    "/admin/analytics",
    "/admin/attendance",
    "/admin/active-subscriptions",
    "/admin/upcoming-payments",
    "/admin/imports",
    "/admin/emails",
    "/admin/documents",
    "/admin/exercises",
    "/admin/settings",
  ];
}

function revalidateAdmin() {
  for (const path of adminPaths()) {
    revalidatePath(path);
  }
}

export async function createMember(formData: FormData) {
  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email");

  if (!fullName || !email) {
    return;
  }

  const member = await prisma.member.create({
    data: {
      fullName,
      email,
      phone: getOptionalString(formData, "phone"),
      address: getOptionalString(formData, "address"),
      gender: getOptionalString(formData, "gender") as Gender | null,
      dateOfBirth: getOptionalDate(formData, "dateOfBirth"),
      joinedAt: getOptionalDate(formData, "joinedAt") ?? new Date(),
      notes: getOptionalString(formData, "notes"),
      status: (getString(formData, "status") || "ACTIVE") as MemberStatus,
    },
  });

  await prisma.emailLog.create({
    data: {
      memberId: member.id,
      recipient: member.email,
      subject: "Dobrodosli v Fitnes Center",
      templateName: "welcome",
      body: `Pozdravljen/a ${member.fullName}, dobrodosel/a v Fitnes Center.`,
      status: EmailStatus.DRAFT,
      provider: "system",
    },
  });

  revalidateAdmin();
}

export async function deleteMember(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) return;
  await prisma.member.update({
    where: { id },
    data: { status: MemberStatus.INACTIVE },
  });
  revalidateAdmin();
}

export async function updateMember(formData: FormData) {
  const id = getString(formData, "id");
  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email");

  if (!id || !fullName || !email) {
    return;
  }

  await prisma.member.update({
    where: { id },
    data: {
      fullName,
      email,
      phone: getOptionalString(formData, "phone"),
      address: getOptionalString(formData, "address"),
      gender: getOptionalString(formData, "gender") as Gender | null,
      dateOfBirth: getOptionalDate(formData, "dateOfBirth"),
      joinedAt: getOptionalDate(formData, "joinedAt") ?? new Date(),
      notes: getOptionalString(formData, "notes"),
      status: (getString(formData, "status") || "ACTIVE") as MemberStatus,
    },
  });

  revalidateAdmin();
  redirect(`/admin/members/${id}`);
}

export async function createTrainer(formData: FormData) {
  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email");
  const specialty = getString(formData, "specialty");

  if (!fullName || !email || !specialty) {
    return;
  }

  await prisma.trainer.create({
    data: {
      fullName,
      email,
      specialty,
      phone: getOptionalString(formData, "phone"),
      bio: getOptionalString(formData, "bio"),
      status: (getString(formData, "status") || "ACTIVE") as TrainerStatus,
      startedAt: getOptionalDate(formData, "startedAt"),
    },
  });

  revalidateAdmin();
}

export async function deleteTrainer(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) return;
  await prisma.trainer.delete({ where: { id } });
  revalidateAdmin();
}

export async function updateTrainer(formData: FormData) {
  const id = getString(formData, "id");
  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email");
  const specialty = getString(formData, "specialty");

  if (!id || !fullName || !email || !specialty) {
    return;
  }

  await prisma.trainer.update({
    where: { id },
    data: {
      fullName,
      email,
      specialty,
      phone: getOptionalString(formData, "phone"),
      bio: getOptionalString(formData, "bio"),
      status: (getString(formData, "status") || "ACTIVE") as TrainerStatus,
      startedAt: getOptionalDate(formData, "startedAt"),
    },
  });

  revalidateAdmin();
  redirect(`/admin/trainers/${id}`);
}

export async function createPlan(formData: FormData) {
  const name = getString(formData, "name");
  const priceCents = getDecimalCents(formData, "price");
  const durationDays = getInt(formData, "durationDays");

  if (!name || Number.isNaN(priceCents) || Number.isNaN(durationDays)) {
    return;
  }

  await prisma.subscriptionPlan.create({
    data: {
      name,
      priceCents,
      durationDays,
      description: getOptionalString(formData, "description"),
    },
  });

  revalidateAdmin();
}

export async function updatePlan(formData: FormData) {
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const priceCents = getDecimalCents(formData, "price");
  const durationDays = getInt(formData, "durationDays");

  if (!id || !name || Number.isNaN(priceCents) || Number.isNaN(durationDays)) {
    return;
  }

  await prisma.subscriptionPlan.update({
    where: { id },
    data: {
      name,
      priceCents,
      durationDays,
      description: getOptionalString(formData, "description"),
      isActive: getString(formData, "isActive") !== "false",
    },
  });

  revalidateAdmin();
}

async function trainerHasConflict(
  trainerId: string,
  start: Date,
  durationMin: number,
  excludeWorkoutId?: string,
) {
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(start);
  dayEnd.setHours(23, 59, 59, 999);

  const workouts = await prisma.workout.findMany({
    where: {
      trainerId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      ...(excludeWorkoutId ? { NOT: { id: excludeWorkoutId } } : {}),
    },
    select: { scheduledAt: true, durationMin: true },
  });

  const startMs = start.getTime();
  const endMs = startMs + durationMin * 60_000;

  return workouts.some((workout) => {
    const workoutStart = workout.scheduledAt.getTime();
    const workoutEnd = workoutStart + workout.durationMin * 60_000;
    return startMs < workoutEnd && endMs > workoutStart;
  });
}

export async function createWorkout(formData: FormData) {
  const title = getString(formData, "title");
  const trainerId = getString(formData, "trainerId");
  const scheduledAt = getString(formData, "scheduledAt");
  const durationMin = getInt(formData, "durationMin");
  const capacity = getInt(formData, "capacity");

  if (!title || !trainerId || !scheduledAt || Number.isNaN(durationMin) || Number.isNaN(capacity)) {
    return;
  }

  const start = new Date(scheduledAt);
  if (await trainerHasConflict(trainerId, start, durationMin)) {
    return;
  }

  await prisma.workout.create({
    data: {
      title,
      trainerId,
      scheduledAt: start,
      durationMin,
      capacity,
      description: getOptionalString(formData, "description"),
      level: (getString(formData, "level") || "BEGINNER") as WorkoutLevel,
      status: (getString(formData, "status") || "SCHEDULED") as WorkoutStatus,
      location: getOptionalString(formData, "location"),
      type: getOptionalString(formData, "type"),
    },
  });

  revalidateAdmin();
}

export async function deleteWorkout(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) return;
  await prisma.workout.delete({ where: { id } });
  revalidateAdmin();
}

export async function updateWorkout(formData: FormData) {
  const id = getString(formData, "id");
  const title = getString(formData, "title");
  const trainerId = getString(formData, "trainerId");
  const scheduledAt = getString(formData, "scheduledAt");
  const durationMin = getInt(formData, "durationMin");
  const capacity = getInt(formData, "capacity");

  if (!id || !title || !trainerId || !scheduledAt || Number.isNaN(durationMin) || Number.isNaN(capacity)) {
    return;
  }

  const start = new Date(scheduledAt);
  if (await trainerHasConflict(trainerId, start, durationMin, id)) {
    return;
  }

  await prisma.workout.update({
    where: { id },
    data: {
      title,
      trainerId,
      scheduledAt: start,
      durationMin,
      capacity,
      description: getOptionalString(formData, "description"),
      level: (getString(formData, "level") || "BEGINNER") as WorkoutLevel,
      status: (getString(formData, "status") || "SCHEDULED") as WorkoutStatus,
      location: getOptionalString(formData, "location"),
      type: getOptionalString(formData, "type"),
    },
  });

  revalidateAdmin();
  redirect(`/admin/workouts/${id}`);
}

export async function checkInAttendance(formData: FormData) {
  const memberId = getString(formData, "memberId");
  const workoutId = getString(formData, "workoutId");
  if (!memberId || !workoutId) return;

  await prisma.attendance.upsert({
    where: { memberId_workoutId: { memberId, workoutId } },
    update: { checkedInAt: new Date() },
    create: { memberId, workoutId },
  });

  revalidateAdmin();
}

export async function createAttendance(formData: FormData) {
  const memberId = getString(formData, "memberId");
  if (!memberId) return;

  const workoutId = getOptionalString(formData, "workoutId");
  const checkedInAt = getOptionalDate(formData, "checkedInAt") ?? new Date();
  const method = (getString(formData, "method") || "MANUAL") as AttendanceMethod;

  if (workoutId) {
    await prisma.attendance.upsert({
      where: { memberId_workoutId: { memberId, workoutId } },
      update: { checkedInAt, method },
      create: { memberId, workoutId, checkedInAt, method },
    });
  } else {
    await prisma.attendance.create({
      data: { memberId, checkedInAt, method },
    });
  }

  revalidateAdmin();
}

export async function createSubscription(formData: FormData) {
  const memberId = getString(formData, "memberId");
  const planId = getString(formData, "planId");
  const startDateRaw = getString(formData, "startDate");

  if (!memberId || !planId || !startDateRaw) {
    return;
  }

  const [plan, member] = await Promise.all([
    prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
    prisma.member.findUnique({ where: { id: memberId } }),
  ]);

  if (!plan || !member) {
    return;
  }

  const startDate = new Date(startDateRaw);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  await prisma.subscription.updateMany({
    where: { memberId, active: true },
    data: { active: false, status: SubscriptionStatus.EXPIRED },
  });

  const subscription = await prisma.subscription.create({
    data: {
      memberId,
      planId,
      startDate,
      endDate,
      active: true,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  await prisma.member.update({
    where: { id: memberId },
    data: { status: MemberStatus.ACTIVE },
  });

  await prisma.document.createMany({
    data: [
      {
        memberId,
        subscriptionId: subscription.id,
        type: DocumentType.MEMBERSHIP_CONFIRMATION,
        title: `Potrdilo - ${member.fullName}`,
        content: `Clan ${member.fullName} ima aktivirano narocnino ${plan.name}.`,
      },
      {
        memberId,
        subscriptionId: subscription.id,
        type: DocumentType.INVOICE,
        title: `Racun - ${member.fullName}`,
        content: `Racun za plan ${plan.name} v vrednosti ${plan.priceCents / 100} EUR.`,
      },
    ],
  });

  revalidateAdmin();
}

export async function extendSubscription(formData: FormData) {
  const id = getString(formData, "id");
  const days = getInt(formData, "days");
  if (!id || Number.isNaN(days)) return;

  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) return;

  const endDate = new Date(subscription.endDate);
  endDate.setDate(endDate.getDate() + days);

  await prisma.subscription.update({
    where: { id },
    data: { endDate, status: SubscriptionStatus.ACTIVE, active: true },
  });

  await prisma.member.update({
    where: { id: subscription.memberId },
    data: { status: MemberStatus.ACTIVE },
  });

  revalidateAdmin();
}

export async function updateSubscriptionStatus(formData: FormData) {
  const id = getString(formData, "id");
  const status = getString(formData, "status");
  if (!id || !status) return;

  await prisma.subscription.update({
    where: { id },
    data: {
      status: status as SubscriptionStatus,
      active: status === "ACTIVE",
    },
  });

  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (subscription && status !== "ACTIVE") {
    await prisma.member.update({
      where: { id: subscription.memberId },
      data: { status: MemberStatus.INACTIVE },
    });
  }

  revalidateAdmin();
}

export async function markPaymentPaid(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) return;
  await prisma.payment.update({
    where: { id },
    data: { status: PaymentStatus.PAID, paidAt: new Date() },
  });
  revalidateAdmin();
}

export async function createStripeCheckout(formData: FormData) {
  const subscriptionId = getString(formData, "subscriptionId");
  if (!subscriptionId) return;

  const stripe = getStripe();
  if (!stripe) {
    redirect("/admin/subscriptions?stripe=missing");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, member: true },
  });

  if (!subscription) {
    return;
  }

  const payment = await prisma.payment.create({
    data: {
      memberId: subscription.memberId,
      subscriptionId: subscription.id,
      amountCents: subscription.plan.priceCents,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.PENDING,
      description: `Narocnina ${subscription.plan.name} za ${subscription.member.fullName}`,
    },
  });

  const session = await stripe!.checkout.sessions.create({
    mode: "payment",
    success_url: `${getBaseUrl()}/admin/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBaseUrl()}/admin/subscriptions?payment=cancelled`,
    customer_email: subscription.member.email,
    metadata: {
      paymentId: payment.id,
      subscriptionId: subscription.id,
      memberId: subscription.memberId,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: subscription.plan.priceCents,
          product_data: {
            name: subscription.plan.name,
            description: subscription.plan.description || "Mesecna fitnes narocnina",
          },
        },
      },
    ],
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  redirect(session.url!);
}

export async function syncStripePayment(sessionId: string) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, reason: "missing_key" as const };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const paymentId = session.metadata?.paymentId;
  if (!paymentId) {
    return { ok: false, reason: "missing_metadata" as const };
  }

  const isPaid = session.payment_status === "paid";
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: isPaid ? PaymentStatus.PAID : PaymentStatus.FAILED,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      paidAt: isPaid ? new Date() : null,
    },
  });

  revalidateAdmin();
  return { ok: isPaid };
}

export async function updateSettings(formData: FormData) {
  const gymName = getString(formData, "gymName");
  if (!gymName) return;

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      gymName,
      address: getOptionalString(formData, "address"),
      email: getOptionalString(formData, "email"),
      phone: getOptionalString(formData, "phone"),
      logoUrl: getOptionalString(formData, "logoUrl"),
      reminderDays: getInt(formData, "reminderDays") || 7,
      currency: getString(formData, "currency") || "EUR",
      pdfFooter: getOptionalString(formData, "pdfFooter"),
      smtpHost: getOptionalString(formData, "smtpHost"),
      smtpPort: getInt(formData, "smtpPort") || null,
      smtpUser: getOptionalString(formData, "smtpUser"),
      smtpFrom: getOptionalString(formData, "smtpFrom"),
    },
    create: {
      id: "default",
      gymName,
      address: getOptionalString(formData, "address"),
      email: getOptionalString(formData, "email"),
      phone: getOptionalString(formData, "phone"),
      logoUrl: getOptionalString(formData, "logoUrl"),
      reminderDays: getInt(formData, "reminderDays") || 7,
      currency: getString(formData, "currency") || "EUR",
      pdfFooter: getOptionalString(formData, "pdfFooter"),
      smtpHost: getOptionalString(formData, "smtpHost"),
      smtpPort: getInt(formData, "smtpPort") || null,
      smtpUser: getOptionalString(formData, "smtpUser"),
      smtpFrom: getOptionalString(formData, "smtpFrom"),
    },
  });

  revalidateAdmin();
}

export async function registerUser(formData: FormData) {
  const fullName = getString(formData, "fullName");
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");
  const planId = getString(formData, "planId");

  if (!fullName || !email || !password || !planId) {
    redirect("/register?error=missing");
  }

  if (password.length < 8) {
    redirect("/register?error=password");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    redirect("/register?error=exists");
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    redirect("/register?error=plan");
  }

  const member = await prisma.member.upsert({
    where: { email },
    update: { fullName, status: MemberStatus.ACTIVE },
    create: { fullName, email, status: MemberStatus.ACTIVE, joinedAt: new Date() },
  });

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  await prisma.subscription.create({
    data: {
      memberId: member.id,
      planId: plan.id,
      startDate,
      endDate,
      active: true,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      role: ROLE.MEMBER,
      memberId: member.id,
    },
  });

  await createSession(user.id);
  redirect("/account");
}

export async function loginUser(formData: FormData) {
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);
  redirect(user.role === ROLE.MEMBER ? "/account" : "/admin");
}

export async function logoutUser() {
  await clearSession();
  redirect("/login");
}

export async function changeMyPlan(formData: FormData) {
  const planId = getString(formData, "planId");
  if (!planId) return;
  const cookieStore = await cookies();
  const token = cookieStore.get("fc_session")?.value;
  if (!token) redirect("/login");

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { member: true } } },
  });

  const memberId = session?.user.memberId;
  if (!memberId) redirect("/login");

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return;

  await prisma.subscription.updateMany({
    where: { memberId, active: true },
    data: { active: false, status: SubscriptionStatus.EXPIRED },
  });

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  await prisma.subscription.create({
    data: {
      memberId,
      planId,
      startDate,
      endDate,
      active: true,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  revalidateAdmin();
  redirect("/account");
}

export async function importMembers(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return;
  }

  const fileName = file.name || "import";
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isXlsx = ext === "xlsx" || ext === "xls";
  const workbook = isXlsx
    ? XLSX.read(buffer, { type: "buffer" })
    : XLSX.read(buffer.toString("utf8"), { type: "string" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const importJob = await prisma.importJob.create({
    data: {
      fileName,
      format: isXlsx ? "XLSX" : "CSV",
      status: ImportStatus.PENDING,
      rowCount: rows.length,
    },
  });

  try {
    let created = 0;
    for (const row of rows) {
      const fullName = String(row.fullName || row.name || row["Ime"] || "").trim();
      const email = String(row.email || row["Email"] || "").trim();
      if (!fullName || !email) continue;

      await prisma.member.upsert({
        where: { email },
        update: {
          fullName,
          phone: String(row.phone || row["Telefon"] || "").trim() || null,
          notes: String(row.notes || row["Opombe"] || "").trim() || null,
        },
        create: {
          fullName,
          email,
          phone: String(row.phone || row["Telefon"] || "").trim() || null,
          notes: String(row.notes || row["Opombe"] || "").trim() || null,
          status: MemberStatus.ACTIVE,
        },
      });
      created += 1;
    }

    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: ImportStatus.COMPLETED,
        note: `Uvozenih ali posodobljenih vrstic: ${created}.`,
      },
    });
  } catch (error) {
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: ImportStatus.FAILED,
        note: error instanceof Error ? error.message : "Import failed.",
      },
    });
  }

  revalidateAdmin();
}

export async function sendTemplateEmail(formData: FormData) {
  const memberId = getOptionalString(formData, "memberId");
  const recipient = getString(formData, "recipient");
  const subject = getString(formData, "subject");
  const templateName = getString(formData, "templateName");
  const body = getString(formData, "body");

  if (!recipient || !subject || !body || !templateName) {
    return;
  }

  const info = await sendEmailMessage({
    to: recipient,
    subject,
    html: `<div style="font-family: Arial, sans-serif; line-height:1.6">${body}</div>`,
  });

  await prisma.emailLog.create({
    data: {
      memberId,
      recipient,
      subject,
      templateName,
      body,
      status: EmailStatus.SENT,
      provider: info.provider,
      sentAt: new Date(),
    },
  });

  revalidateAdmin();
}

export async function syncExercises() {
  const items = await fetchExercisesFromApi();

  for (const item of items) {
    await prisma.exercise.upsert({
      where: { slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") },
      update: {
        description: item.description,
        imageUrl: item.imageUrl,
        targetArea: item.targetArea,
        source: ExerciseSource.API,
        externalId: item.externalId,
      },
      create: {
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        targetArea: item.targetArea,
        source: ExerciseSource.API,
        externalId: item.externalId,
      },
    });
  }

  revalidateAdmin();
}

export async function seedDatabase() {
  redirect("/admin");
}
