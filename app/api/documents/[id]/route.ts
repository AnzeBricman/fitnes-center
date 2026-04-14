import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSimplePdf } from "@/lib/pdf";
import { formatDateTime } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: { member: true, subscription: { include: { plan: true } } },
  });

  if (!document) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pdf = await createSimplePdf({
    title: document.title,
    subtitle: `${document.type} · ${formatDateTime(document.createdAt)}`,
    lines: [
      `Clan: ${document.member?.fullName ?? "Ni vezan"}`,
      `Plan: ${document.subscription?.plan.name ?? "Ni vezan"}`,
      "",
      document.content,
    ],
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${document.title.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
