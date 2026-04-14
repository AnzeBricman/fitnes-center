import type { ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";

type DashboardShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  title,
  description,
  actions,
  children,
}: DashboardShellProps) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-kicker">Fitnes Center</span>
          <h1>Gym OS</h1>
          <p>Uporabna osnova za clane, trenerje, narocnine, prisotnost in urnike.</p>
        </div>

        <div className="sidebar-summary">
          <span className="section-kicker">Sistem</span>
          <h3>Administracija v enem pogledu</h3>
          <p>Dodaj clane, pripravi pakete, vodi urnik in spremljaj poteke narocnin.</p>
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
            {actions}
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
