import Link from "next/link";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-ink"
      >
        <span className="absolute inset-0 rounded-md bg-ink" />
        <span className="absolute left-1.5 top-1.5 h-1 w-4 rounded-full bg-cream-50" />
        <span className="absolute left-1.5 top-3 h-1 w-2.5 rounded-full bg-cream-50" />
        <span className="absolute left-1.5 top-[18px] h-1 w-3 rounded-full bg-accent" />
      </span>
      <span
        className={`font-display font-semibold tracking-tightish ${
          small ? "text-base" : "text-lg"
        } text-ink`}
      >
        Public Comment{" "}
        <span className="italic text-accent">Amplifier</span>
      </span>
    </Link>
  );
}
