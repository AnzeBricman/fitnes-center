import Link from "next/link";
import { syncStripePayment } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const result = session_id ? await syncStripePayment(session_id) : { ok: false };

  return (
    <main className="landing-shell">
      <section className="panel-card">
        <span className="section-kicker">Stripe</span>
        <h3>{result.ok ? "Placilo je bilo uspesno potrjeno." : "Placila ni bilo mogoce potrditi."}</h3>
        <p className="empty-state">
          {result.ok
            ? "Zapis placila je posodobljen in narocnina ostaja aktivna."
            : "Preveri Stripe kljuce ali session_id in poskusi znova."}
        </p>
        <div className="landing-actions">
          <Link href="/admin/subscriptions" className="primary-button">Nazaj na narocnine</Link>
          <Link href="/admin" className="ghost-link">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
