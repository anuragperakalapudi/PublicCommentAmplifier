import Link from "next/link";
import Image from "next/image";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center overflow-hidden rounded-md bg-paper">
        <Image
          src="/opencommentlogo.png"
          alt=""
          width={small ? 30 : 34}
          height={small ? 30 : 34}
          sizes={small ? "30px" : "34px"}
          className={small ? "h-7 w-7 object-cover" : "h-8 w-8 object-cover"}
          priority={!small}
        />
      </span>
      <span
        className={`font-display font-semibold tracking-tighter ${
          small ? "text-base" : "text-lg"
        } text-ink`}
      >
        Open<span className="italic text-accent">Comment</span>
      </span>
    </Link>
  );
}
