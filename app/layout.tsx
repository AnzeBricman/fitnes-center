import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitnes Center",
  description: "Gym management sistem v Next.js za clane, trenerje in narocnine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl">
      <body>{children}</body>
    </html>
  );
}
