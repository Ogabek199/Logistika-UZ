import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { LocaleProvider } from "@/i18n";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Logistika UZ",
  description: "Haydovchi va hujjatlaringizni bir joyda boshqaring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
