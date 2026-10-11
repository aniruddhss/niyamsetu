import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bhumi Vikas Sahayak",
  description: "Bilingual reference assistant for Madhya Pradesh building rules.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
