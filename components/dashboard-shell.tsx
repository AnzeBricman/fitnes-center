import type { ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { requireRole } from "@/lib/auth";
import type { AppRole } from "@/lib/roles";
import { DASHBOARD_ROLES } from "@/lib/roles";
import Link from "next/link";

type DashboardShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  roles?: AppRole[];
  children: ReactNode;
};

export async function DashboardShell({
  title,
  description,
  actions,
  roles = DASHBOARD_ROLES,
  children,
}: DashboardShellProps) {
  const user = await requireRole(roles);
  const displayName = user.member?.fullName ?? user.email;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-kicker">Fitnes Center</span>
          <h1>Gym OS</h1>
          <p>Uporabna osnova za clane, trenerje, narocnine, prisotnost in urnike.</p>
        </div>

        <SidebarNav />
      </aside>

      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Admin panel</span>
            <h2>{title}</h2>
          </div>

          <div className="topbar-actions">
            <p>{description}</p>
            <div className="header-actions">
              <span className="support-note">{displayName}</span>
              <Link className="ghost-link" href="/account">Moj racun</Link>
              <Link className="ghost-link" href="/logout">Odjava</Link>
              {actions}
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
