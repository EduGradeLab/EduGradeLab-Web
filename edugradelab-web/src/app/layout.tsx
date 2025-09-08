import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EduGradeLab - Sınav Kağıdı Analiz Platformu",
  description: "AI destekli sınav kağıdı analiz ve değerlendirme platformu",
  keywords: ["sınav", "analiz", "öğretmen", "eğitim", "AI"],
  authors: [{ name: "EduGradeLab" }],
  openGraph: {
    title: "EduGradeLab",
    description: "AI destekli sınav kağıdı analiz platformu",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
