import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بوصلة | Bawsala - قرارك العقاري، بوضوح",
  description: "دليلك الموثوق لاختيار العقار الأنسب لك، بدون تحيز أو حيرة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <body className="bg-ivory text-espresso antialiased min-h-screen selection:bg-sand selection:text-espresso font-arabic">
        {children}
      </body>
    </html>
  );
}
