import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pot — Stablecoin fundraisers that work everywhere.",
  description:
    "Like GoFundMe, but it works in 66 countries, settles in seconds, and has zero platform fees. Onchain pots powered by cUSD on Celo.",
  other: {
    "talentapp:project_verification":
      "678a865aecfb0d09017c130b8641d4f7c368aef87e77942a1cb89208a848d83b2e37d0ffe837df6bd6211dd39c5097e18dbaf4001df6b587781d39183cca86ad",
  },
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
