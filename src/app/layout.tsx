import type { Metadata } from "next";
import { Almarai } from "next/font/google";
import "./globals.css";
import { InstrumentCursor } from "@/components/ui/instrument-cursor";
import { IntroOverlay } from "@/components/brand/intro-overlay";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بوصلة العقار | مستشارك الهندسي والمالي المحايد",
  description: "فحص فني وهندسي مستقل لقرار التملك بأرقام قطعية وتدقيق محايد",
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
    <html lang="ar" dir="rtl" className={`scroll-smooth ${almarai.variable}`}>
      <head>
        {/* Preload Thmanyah display font for main titles & headers */}
        <link
          rel="preload"
          href="/fonts/thmanyah-serif-display-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-[var(--cream)] text-[var(--navy)] antialiased font-body selection:bg-[var(--mist)] selection:text-[var(--navy)] min-h-screen">
        <IntroOverlay />
        {children}
        <InstrumentCursor />
      </body>
    </html>
  );
}
