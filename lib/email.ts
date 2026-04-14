import nodemailer from "nodemailer";

export async function sendEmailMessage({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "fitnes-center@example.com";

  const transporter = host
    ? nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      })
    : nodemailer.createTransport({
        jsonTransport: true,
      });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  return {
    provider: host ? "smtp" : "jsonTransport",
    messageId: info.messageId,
  };
}
