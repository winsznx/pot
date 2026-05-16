import type { MetadataRoute } from "next";
import { MOCK_POTS } from "@/lib/mock-pots";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pot.timjosh507.workers.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/create`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  const potRoutes: MetadataRoute.Sitemap = MOCK_POTS.map((pot) => ({
    url: `${SITE_URL}/p/${pot.id}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...potRoutes];
}
