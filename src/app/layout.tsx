import type { Metadata } from "next";
import { Bricolage_Grotesque, Spline_Sans } from "next/font/google";
import "./globals.css";

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
  description: "Public activity board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${spline.variable} ${bricolage.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
