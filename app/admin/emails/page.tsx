import { sendTemplateEmail } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getEmailPageData, getMembersPageData } from "@/lib/dashboard-data";
import { formatDateTime, formatLabel } from "@/lib/utils";

export default async function EmailsPage() {
  const [logs, membersData] = await Promise.all([getEmailPageData(), getMembersPageData()]);

  return (
    <DashboardShell
      title="Email"
      description="Dobrodoslice, opomniki za potek narocnin in obvestila iz admin panela."
    >
      <section className="content-layout">
        <article className="panel-card form-card">
          <div className="panel-card-header"><div><span className="section-kicker">Poslji sporocilo</span><h3>Email sistem</h3></div></div>
          <form action={sendTemplateEmail} className="admin-form">
            <label>
              <span>Predloga</span>
              <select name="templateName" defaultValue="renewal-reminder">
                <option value="welcome">Dobrodoslica</option>
                <option value="renewal-reminder">Opomnik za obnovo</option>
                <option value="admin-notice">Admin obvestilo</option>
              </select>
            </label>
            <label>
              <span>Clan</span>
              <select name="memberId" defaultValue="">
                <option value="">Ni vezano na clana</option>
                {membersData.members.map((member) => (
                  <option key={member.id} value={member.id}>{member.fullName}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Prejemnik</span>
              <input name="recipient" type="email" required placeholder="email@primer.si" />
            </label>
            <label>
              <span>Zadeva</span>
              <input name="subject" required placeholder="Opomnik za podaljsanje narocnine" />
            </label>
            <label className="form-span-2">
              <span>Sporocilo</span>
              <textarea
                name="body"
                rows={6}
                defaultValue="Pozdravljeni, obvescamo vas glede vase narocnine v Fitnes Center."
              />
            </label>
            <button className="primary-button" type="submit">Poslji email</button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-card-header"><div><span className="section-kicker">Dnevnik</span><h3>Poslana sporocila</h3></div></div>
          <div className="table-list">
            {logs.map((log) => (
              <div key={log.id} className="table-row">
                <div>
                  <strong>{log.subject}</strong>
                  <span>{log.recipient} · {log.templateName}</span>
                </div>
                <div className="table-row-meta">
                  <strong>{formatLabel(log.status)}</strong>
                  <span>{log.sentAt ? formatDateTime(log.sentAt) : formatDateTime(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
