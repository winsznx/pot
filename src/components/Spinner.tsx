type Props = {
  size?: number;
  ariaLabel?: string;
  className?: string;
};

export function Spinner({ size = 16, ariaLabel = "Loading", className = "" }: Props) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
