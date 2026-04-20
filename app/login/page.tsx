import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  return (
    <main className="landing-shell">
      <section className="panel-card form-card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <span className="section-kicker">Prijava</span>
        <h2>Prijavi se v Fitnes Center.</h2>
        {params.error ? (
          <p className="empty-state">
            {params.error === "invalid"
              ? "Napacni podatki."
              : params.error === "missing"
                ? "Izpolni vsa polja."
                : params.error === "password"
                  ? "Geslo mora imeti vsaj 8 znakov."
                : ""}
          </p>
        ) : null}
        <form className="admin-form" action="/auth/login" method="post">
          <label className="form-span-2"><span>Email</span><input name="email" type="email" required /></label>
          <label className="form-span-2"><span>Geslo</span><input name="password" type="password" required /></label>
          <button className="primary-button" type="submit">Prijava</button>
        </form>
        <div className="landing-actions">
          <Link href="/register" className="ghost-link">Registracija</Link>
          <Link href="/" className="ghost-link">Nazaj na zacetek</Link>
        </div>
      </section>
    </main>
  );
}
