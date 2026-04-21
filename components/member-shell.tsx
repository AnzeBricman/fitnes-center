import type { ReactNode } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { MemberNav } from "@/components/member-nav";

type MemberShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export async function MemberShell({
  title,
  description,
  children,
  actions,
}: MemberShellProps) {
  const user = await getSessionUser();
  const displayName = user?.member?.fullName ?? user?.email ?? "Gost";

  return (
    <main className="member-shell">
      <header className="member-topbar">
        <div className="member-brand">
          <span className="brand-kicker">Fitnes Center</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="member-topbar-side">
          <div className="member-user-chip">
            <span>Aktivna seja</span>
            <strong>{displayName}</strong>
          </div>
          <div className="member-auth-actions">
            {user ? (
              <>
                <Link href="/account" className="ghost-link">Moj racun</Link>
                <Link href="/logout" className="primary-button">Odjava</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="ghost-link">Prijava</Link>
                <Link href="/register" className="primary-button">Registracija</Link>
              </>
            )}
            {actions}
          </div>
        </div>
      </header>

      <MemberNav />

      {children}
    </main>
  );
}
