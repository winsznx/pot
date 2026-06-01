import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import { Providers } from "./providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pot.timjosh507.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  applicationName: "Pot",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Pot" },
  title: "Pot — Onchain fundraisers across Celo and Stacks.",
  description:
    "Like GoFundMe, but every campaign is a contract — settled in cUSD on Celo or STX on Stacks, with zero platform fees and no signup.",
  openGraph: {
    type: "website",
    siteName: "Pot",
    title: "Pot — Onchain fundraisers across Celo and Stacks.",
    description:
      "Like GoFundMe, but every campaign is a contract — settled in cUSD on Celo or STX on Stacks, with zero platform fees and no signup.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Pot — Stablecoin fundraisers that work everywhere.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pot — Stablecoin fundraisers that work everywhere.",
    description:
      "Like GoFundMe, but it works in 66 countries, settles in seconds, and has zero platform fees.",
    images: ["/og.png"],
  },
  keywords: [
    "fundraising",
    "stablecoin",
    "celo",
    "stacks",
    "cusd",
    "stx",
    "onchain escrow",
    "crowdfunding",
    "no platform fees",
  ],
  other: {
    "talentapp:project_verification":
      "678a865aecfb0d09017c130b8641d4f7c368aef87e77942a1cb89208a848d83b2e37d0ffe837df6bd6211dd39c5097e18dbaf4001df6b587781d39183cca86ad",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f8f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
