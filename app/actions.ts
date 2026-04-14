"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DocumentType,
  EmailStatus,
  ExerciseSource,
  ImportStatus,
  MemberStatus,
  PaymentProvider,
  PaymentStatus,
  WorkoutLevel,
} from "@prisma/client";
import { sendEmailMessage } from "@/lib/email";
import { fetchExercisesFromApi } from "@/lib/exercise-api";
import { prisma } from "@/lib/prisma";
import { getBaseUrl, getStripe } from "@/lib/stripe";

function getString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
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

function adminPaths() {
  return [
    "/admin",
    "/admin/members",
    "/admin/trainers",
    "/admin/workouts",
    "/admin/subscriptions",
    "/admin/analytics",
    "/admin/imports",
    "/admin/emails",
    "/admin/documents",
    "/admin/exercises",
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
  await prisma.member.delete({ where: { id } });
  revalidateAdmin();
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

export async function createWorkout(formData: FormData) {
  const title = getString(formData, "title");
  const trainerId = getString(formData, "trainerId");
  const scheduledAt = getString(formData, "scheduledAt");
  const durationMin = getInt(formData, "durationMin");
  const capacity = getInt(formData, "capacity");

  if (!title || !trainerId || !scheduledAt || Number.isNaN(durationMin) || Number.isNaN(capacity)) {
    return;
  }

  await prisma.workout.create({
    data: {
      title,
      trainerId,
      scheduledAt: new Date(scheduledAt),
      durationMin,
      capacity,
      description: getOptionalString(formData, "description"),
      level: (getString(formData, "level") || "BEGINNER") as WorkoutLevel,
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

  const subscription = await prisma.subscription.upsert({
    where: { memberId },
    update: {
      planId,
      startDate,
      endDate,
      active: true,
    },
    create: {
      memberId,
      planId,
      startDate,
      endDate,
      active: true,
    },
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
