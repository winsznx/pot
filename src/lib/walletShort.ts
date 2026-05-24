/**
 * Wallet-address abbreviations beyond shortAddr. ensName falls through when
 * present, otherwise we slice the hex with configurable head/tail.
 */
export function walletShort(
  address: string,
  options: { head?: number; tail?: number; ensName?: string | null } = {},
): string {
  if (options.ensName) return options.ensName;
  const { head = 6, tail = 4 } = options;
  if (!address || address.length < head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}
