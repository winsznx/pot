import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <main className="app-shell">
      <Header />
      <section id="main" className="container-wide flex flex-col items-center gap-6 py-24 text-center">
        <span className="text-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
          404 · gone fishing
        </span>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">
          Nothing here. The pot you wanted is in another castle.
        </h1>
        <p className="max-w-md text-mono text-sm text-[var(--text-secondary)]">
          Check the URL, ask whoever shared it for an updated link, or head back home and start a fresh pot.
        </p>
        <div className="mt-2 flex gap-3">
          <Link href="/" className="btn-manifesto">
            Back home
          </Link>
          <Link href="/create" className="btn-ghost">
            Open a new pot
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
