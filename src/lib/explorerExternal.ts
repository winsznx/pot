/**
 * External wallet/network deep-links beyond celoscan. Mostly used by share +
 * MiniPay surfaces that want the user to land inside their wallet.
 */
export function metamaskAddTokenUrl(token: string, symbol = "cUSD", decimals = 18): string {
  const params = new URLSearchParams({
    type: "ERC20",
    address: token,
    symbol,
    decimals: decimals.toString(),
  });
  return `metamask://wallet/asset/add?${params.toString()}`;
}

export function valoraDeepLink(path: string): string {
  return `celo://wallet${path.startsWith("/") ? path : `/${path}`}`;
}

export function miniPayInstallUrl(): string {
  return "https://www.opera.com/products/minipay";
}
