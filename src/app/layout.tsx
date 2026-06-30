import type { Metadata } from "next";
import { Bricolage_Grotesque, Spline_Sans } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/ThemeScript";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const spline = Spline_Sans({
  variable: "--font-spline",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Second Brain OS",
  description: "Public activity dashboard — track work, study, projects & more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${spline.variable} ${bricolage.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
