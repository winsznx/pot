import type { MetadataRoute } from "next";
import { fetchNextPotId } from "@/lib/chain";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pot.timjosh507.workers.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/create`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  // Enumerate every minted pot id (0..nextPotId-1) so crawlers see /p/<id>.
  // When the contract isn't deployed yet, fetchNextPotId returns 0n and we
  // emit only the static routes — never anything mocked.
  let nextId: bigint;
  try {
    nextId = await fetchNextPotId();
  } catch {
    nextId = 0n;
  }

  const potRoutes: MetadataRoute.Sitemap = [];
  for (let i = 0n; i < nextId; i += 1n) {
    potRoutes.push({
      url: `${SITE_URL}/p/${i.toString().padStart(4, "0")}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.6,
    });
  }

  return [...staticRoutes, ...potRoutes];
}
