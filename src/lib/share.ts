/**
 * Pot share URLs and copy. Centralised so the share buttons + meta tags + OG
 * image generator all read from the same place.
 */
export const SHARE_HOST = "https://pot.timjosh507.workers.dev";

export function potUrl(potId: bigint | number | string): string {
  return `${SHARE_HOST}/p/${potId.toString()}`;
}

export function defaultShareText(title?: string): string {
  if (!title) return "I just opened a Pot — onchain on Celo and Stacks. Chip in or share it →";
  return `${title} — fund it onchain on Celo (cUSD) or Stacks (STX) →`;
}

export function whatsAppLink(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

export function tweetLink(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function telegramLink(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
