import type { Metadata } from "next";
import { Rubik } from "next/font/google";

import "./globals.css";

const rubik = Rubik({
  subsets: ["cyrillic", "latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "Дашборд заказов RetailCRM",
  description: "Дашборд заказов на основе витрины данных в Supabase для тестового задания.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={rubik.variable}>
      <body>{children}</body>
    </html>
  );
}
