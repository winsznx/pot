import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pot.timjosh507.workers.dev";

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcProjectId
      ? [
          walletConnect({
            projectId: wcProjectId,
            metadata: {
              name: "Pot",
              description: "Stablecoin fundraisers that work everywhere.",
              url: siteUrl,
              icons: [],
            },
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

export const POT_ADDRESS = (process.env.NEXT_PUBLIC_POT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const CUSD_ADDRESS = (process.env.NEXT_PUBLIC_CUSD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const ACTIVE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? celo.id);
export const isPotDeployed = POT_ADDRESS !== "0x0000000000000000000000000000000000000000";
