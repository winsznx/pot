import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PotNotFound() {
  return (
    <main className="app-shell">
      <Header />
      <section id="main" className="container-wide flex flex-col items-center gap-6 py-24 text-center">
        <span className="text-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
          404 · pot not found
        </span>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">
          No pot with that id on this network.
        </h1>
        <p className="max-w-md text-mono text-sm text-[var(--text-secondary)]">
          The pot may have been created on a different chain, or the id is malformed. Double-check the URL.
        </p>
        <div className="mt-2 flex gap-3">
          <Link href="/" className="btn-manifesto">See live pots</Link>
          <Link href="/create" className="btn-ghost">Start your own</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
