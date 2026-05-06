import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const aeonik = Inter({
  subsets: ["latin"],
  variable: "--font-aeonik",
  display: "swap",
});

const input = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-input",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pot — Stablecoin fundraisers that work everywhere.",
  description:
    "Like GoFundMe, but it works in 66 countries, settles in seconds, and has zero platform fees. Onchain pots powered by cUSD on Celo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${aeonik.variable} ${input.variable}`}>{children}</body>
    </html>
  );
}
