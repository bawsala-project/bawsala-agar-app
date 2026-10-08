import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Tajawal, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AppEmbedHandler } from "@/components/shell/AppEmbedHandler";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بوصلة العقار | BAWSALA - المساعد التنفيذي للقرار العقاري",
  description: "المساعد الذكي الأول لاتخاذ القرارات السكنية الفاخرة في المملكة العربية السعودية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexArabic.variable} ${tajawal.variable} ${cormorant.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (
                  (navigator.connection && navigator.connection.saveData === true) ||
                  (navigator.deviceMemory && navigator.deviceMemory < 4)
                ) {
                  document.documentElement.classList.add('lite-mode');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-espresso text-sandstone antialiased min-h-screen selection:bg-sandstone/20 selection:text-sandstone font-arabic">
        <AppEmbedHandler />
        {children}
      </body>
    </html>
  );
}
