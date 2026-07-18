import type { Metadata, Viewport } from "next";
import { Manrope, Syne } from "next/font/google";
import { LocaleProvider } from "@/i18n";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { PwaScript } from "@/components/pwa-script";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
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
  title: 'OOO "MUSFIRA SAVDO TRANS"',
  description: "Haydovchi va hujjatlaringizni bir joyda boshqaring",
  applicationName: 'OOO "MUSFIRA SAVDO TRANS"',
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MUSFIRA SAVDO TRANS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: `/mst-mark-v6.png`, sizes: "512x512", type: "image/png" },
      { url: `/icons/mst-v6-192.png`, sizes: "192x192", type: "image/png" },
      { url: `/icons/mst-v6-512.png`, sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico?v=6", sizes: "any" },
    ],
    shortcut: `/mst-mark-v6.png`,
    apple: [{ url: `/apple-touch-icon.png?v=6`, sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#071525" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1520" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${display.variable} ${body.variable} h-full`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <ThemeScript />
        <PwaScript />
      </head>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider>
            <PwaRegister />
            {children}
            <PwaInstallBanner />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
