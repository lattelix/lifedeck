import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Spline_Sans } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/ThemeScript";
import { ThemeController } from "@/components/ThemeController";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const spline = Spline_Sans({
  variable: "--font-spline",
  subsets: ["latin", "latin-ext"],
});

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#161719' },
  ],
};

export const metadata: Metadata = {
  title: "Alex — живой профиль",
  description: "Публичный профиль реальной активности из GitHub, LeetCode, Codewars и других подключаемых источников.",
  applicationName: "Second Brain OS",
  openGraph: {
    title: "Alex — живой профиль",
    description: "Доказуемая активность по проектам, обучению и алгоритмам в одной self-owned витрине.",
    type: "profile",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary",
    title: "Alex — живой профиль",
    description: "Доказуемая активность по проектам, обучению и алгоритмам.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${spline.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased">
        <ThemeController />
        {children}
      </body>
    </html>
  );
}
