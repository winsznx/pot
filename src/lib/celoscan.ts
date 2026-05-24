/**
 * Tiny URL builder for Celoscan links so we don't sprinkle hardcoded strings
 * across the codebase. Network defaults to mainnet but accepts the chainId so
 * Alfajores keeps working when wired up later.
 */
const HOSTS: Record<number, string> = {
  42220: "https://celoscan.io",
  44787: "https://alfajores.celoscan.io",
};

function base(chainId = 42220): string {
  return HOSTS[chainId] ?? HOSTS[42220]!;
}

export function txUrl(hash: string, chainId?: number): string {
  return `${base(chainId)}/tx/${hash}`;
}

export function addressUrl(address: string, chainId?: number): string {
  return `${base(chainId)}/address/${address}`;
}

export function blockUrl(block: number | bigint, chainId?: number): string {
  return `${base(chainId)}/block/${block.toString()}`;
}

export function tokenUrl(address: string, chainId?: number): string {
  return `${base(chainId)}/token/${address}`;
}
