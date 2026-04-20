import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { DASHBOARD_ROLES } from "@/lib/roles";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireRole(DASHBOARD_ROLES);

  return children;
}
