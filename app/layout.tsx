import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitnes Center",
  description: "Poslovna aplikacija za upravljanje fitnes centra, clanov, trenerjev in narocnin.",
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
