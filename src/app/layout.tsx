import type { Metadata } from "next";
import { Italiana } from "next/font/google";
import "./globals.css";
import { InstrumentCursor } from "@/components/ui/instrument-cursor";

const italiana = Italiana({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wordmark",
  display: "swap",
  fallback: ["Cormorant Garamond", "serif"],
});

export const metadata: Metadata = {
  title: "بوصلة العقار | مستشارك الذكي لقرار شراء شقتك",
  description: "مستشارك الذكي المستقل لمفاضلة واختيار الشقق السكنية في السعودية وفق ميزانيتك وأولوياتك بـ 10 ريالات للاستشارة",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`scroll-smooth ${italiana.variable}`}>
      <head>
        {/* Preload primary Thmanyah fonts */}
        <link
          rel="preload"
          href="/fonts/thmanyah-serif-display-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/thmanyah-sans-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/thmanyah-sans-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-[var(--cream)] text-[var(--navy)] antialiased font-body selection:bg-[var(--mist)] selection:text-[var(--navy)] min-h-screen">
        {children}
        <InstrumentCursor />
      </body>
    </html>
  );
}
