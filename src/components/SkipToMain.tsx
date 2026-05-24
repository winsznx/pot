/**
 * Visually hidden until focused. Screen readers / keyboard-first users hit
 * Tab and can jump past the nav.
 */
export function SkipToMain() {
  return (
    <a
      href="#main"
      className="absolute left-2 top-2 z-[100] -translate-y-20 rounded-md bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-[var(--text-inverse)] transition-transform focus:translate-y-0 focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
