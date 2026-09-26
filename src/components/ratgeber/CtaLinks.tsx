import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ArticleLink } from "@/content/ratgeber";

/** Primary button plus an optional secondary link, for use on the dark graphite band. */
export function CtaLinks({ primary, secondary }: { primary: ArticleLink; secondary?: ArticleLink }) {
  return (
    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
      <Link
        href={primary.href}
        className="inline-flex items-center justify-center gap-2.5 rounded-[2px] bg-kreide px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-kreide-deep focus-visible:outline-kreide-light"
      >
        {primary.label}
        <ArrowRight className="size-4" strokeWidth={1.6} aria-hidden="true" />
      </Link>
      {secondary ? (
        <Link
          href={secondary.href}
          className="inline-flex items-center justify-center gap-2 py-2 text-base font-medium text-blatt underline decoration-blatt/40 underline-offset-4 transition-colors hover:decoration-blatt focus-visible:outline-kreide-light sm:justify-start"
        >
          {secondary.label}
        </Link>
      ) : null}
    </div>
  );
}
