import type { Metadata } from "next";
import "./globals.css";
import { InstrumentCursor } from "@/components/ui/instrument-cursor";

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
    <html lang="ar" dir="rtl" className="scroll-smooth">
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
