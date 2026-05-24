/**
 * Tiny className joiner. Drops falsey values and dedupes whitespace.
 * Use for runtime-conditional classes; static ones are clearer inline.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
