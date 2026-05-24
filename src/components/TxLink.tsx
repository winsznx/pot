import { txUrl } from "@/lib/celoscan";

type Props = {
  hash: string;
  chainId?: number;
  label?: string;
  className?: string;
};

export function TxLink({ hash, chainId, label, className = "" }: Props) {
  return (
    <a
      href={txUrl(hash, chainId)}
      target="_blank"
      rel="noreferrer"
      className={`text-mono text-xs hover:underline ${className}`}
      title={hash}
    >
      {label ?? `${hash.slice(0, 8)}…${hash.slice(-6)}`}
    </a>
  );
}
