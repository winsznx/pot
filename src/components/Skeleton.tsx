type Props = {
  className?: string;
  rounded?: boolean;
  ariaLabel?: string;
};

export function Skeleton({ className = "", rounded = false, ariaLabel = "Loading" }: Props) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      className={`skeleton ${rounded ? "rounded-full" : "rounded-md"} ${className}`}
    />
  );
}
