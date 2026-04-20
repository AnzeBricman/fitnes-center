import { updateSettings } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSettingsData } from "@/lib/dashboard-data";

export default async function SettingsPage() {
  const settings = await getSettingsData();

  return (
    <DashboardShell
      title="Nastavitve"
      description="Osnovne nastavitve fitnes centra, PDF in email konfiguracija."
    >
      <section className="panel-card form-card">
        <div className="panel-card-header"><div><span className="section-kicker">Sistem</span><h3>Konfiguracija</h3></div></div>
        <form action={updateSettings} className="admin-form">
          <label><span>Naziv fitnes centra</span><input name="gymName" defaultValue={settings?.gymName ?? "Fitnes Center"} required /></label>
          <label><span>Kontaktni email</span><input name="email" type="email" defaultValue={settings?.email ?? ""} /></label>
          <label><span>Telefon</span><input name="phone" defaultValue={settings?.phone ?? ""} /></label>
          <label><span>Naslov</span><input name="address" defaultValue={settings?.address ?? ""} /></label>
          <label><span>Logo URL</span><input name="logoUrl" defaultValue={settings?.logoUrl ?? ""} /></label>
          <label><span>Opomnik (dni)</span><input name="reminderDays" type="number" defaultValue={settings?.reminderDays ?? 7} /></label>
          <label><span>Valuta</span><input name="currency" defaultValue={settings?.currency ?? "EUR"} /></label>
          <label className="form-span-2"><span>PDF noga</span><textarea name="pdfFooter" rows={3} defaultValue={settings?.pdfFooter ?? ""} /></label>

          <label><span>SMTP host</span><input name="smtpHost" defaultValue={settings?.smtpHost ?? ""} /></label>
          <label><span>SMTP port</span><input name="smtpPort" type="number" defaultValue={settings?.smtpPort ?? ""} /></label>
          <label><span>SMTP uporabnik</span><input name="smtpUser" defaultValue={settings?.smtpUser ?? ""} /></label>
          <label><span>SMTP from</span><input name="smtpFrom" defaultValue={settings?.smtpFrom ?? ""} /></label>

          <button className="primary-button" type="submit">Shrani nastavitve</button>
        </form>
      </section>
    </DashboardShell>
  );
}
