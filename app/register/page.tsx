import { registerUser } from "@/app/actions";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import { ROLE } from "@/lib/roles";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === ROLE.MEMBER ? "/account" : "/admin");
  }

  const params = (await searchParams) ?? {};
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priceCents: "asc" },
  });

  return (
    <main className="landing-shell">
      <section className="panel-card form-card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <span className="section-kicker">Registracija</span>
        <h2>Ustvari uporabniski racun.</h2>
        {params.error ? (
          <p className="empty-state">
            {params.error === "exists"
              ? "Uporabnik ze obstaja."
              : params.error === "missing"
                ? "Izpolni vsa polja."
                : params.error === "password"
                  ? "Geslo mora imeti vsaj 8 znakov."
                : params.error === "plan"
                  ? "Izberi veljaven paket."
                  : ""}
          </p>
        ) : null}
        {plans.length === 0 ? (
          <p className="empty-state">Registracija trenutno ni mozna, ker ni nastavljenega nobenega aktivnega paketa.</p>
        ) : (
        <form className="admin-form" action={registerUser}>
          <label><span>Ime in priimek</span><input name="fullName" required /></label>
          <label><span>Email</span><input name="email" type="email" required /></label>
          <label className="form-span-2"><span>Geslo</span><input name="password" type="password" required /></label>
          <label className="form-span-2">
            <span>Izberi paket</span>
            <select name="planId" required defaultValue="">
              <option value="" disabled>Izberi eno izmed treh narocnin</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatCurrency(plan.priceCents)} / {plan.durationDays} dni
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit">Registriraj se</button>
        </form>
        )}
        <div className="landing-actions">
          <Link href="/login" className="ghost-link">Ze imam racun</Link>
          <Link href="/admin" className="ghost-link">Admin prijava</Link>
        </div>
      </section>
    </main>
  );
}
