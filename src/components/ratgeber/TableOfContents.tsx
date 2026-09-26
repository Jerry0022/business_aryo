import type { ArticleSection } from "@/content/ratgeber";

/** Numbered table of contents; sticky next to the text on large screens. */
export function TableOfContents({ sections }: { sections: readonly ArticleSection[] }) {
  return (
    <nav aria-labelledby="inhalt" className="border-l border-strich-dark pl-5">
      <h2 id="inhalt" className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-graphit-muted sm:text-xs">
        Inhalt
      </h2>
      <ol className="mt-3 space-y-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="group flex gap-3 text-[0.95rem] leading-snug text-graphit-soft transition-colors hover:text-kreide"
            >
              <span aria-hidden="true" className="pt-px font-mono text-xs text-kreide">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="underline decoration-transparent underline-offset-[3px] transition-colors group-hover:decoration-kreide/50">
                {section.heading}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
