import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
