import Link from "next/link";
import type { ReactNode } from "react";
import { navigation } from "@/lib/mock-data";

type DashboardShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function DashboardShell({
  title,
  description,
  children,
}: DashboardShellProps) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-kicker">Fitnes Center</span>
          <h1>Gym OS</h1>
          <p>Osnova za interno administracijo, clane in urnike.</p>
        </div>

        <nav className="sidebar-nav" aria-label="Glavna navigacija">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Admin panel</span>
            <h2>{title}</h2>
          </div>
          <p>{description}</p>
        </header>

        {children}
      </section>
    </main>
  );
}
