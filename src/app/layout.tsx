import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NiyamSetu · Bhumi Vikas Sahayak (MP Building Rules)",
  description: "Bilingual reference assistant for Madhya Pradesh Bhumi Vikas Rules with verified source citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansDevanagari.variable}`}>
      <body className="min-h-screen bg-white text-[#171717] antialiased">
        {children}
      </body>
    </html>
  );
}
