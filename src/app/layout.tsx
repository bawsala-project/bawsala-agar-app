import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بوصلة العقار | مستشارك الهندسي والمالي المحايد",
  description: "فحص فني وهندسي مستقل لقرار التملك بأرقام قطعية وتدقيق محايد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className="bg-[#F8FAFC] text-slate-800 antialiased selection:bg-blue-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
