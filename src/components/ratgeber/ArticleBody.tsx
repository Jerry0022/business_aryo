import type { ArticleBlock, ArticleSection } from "@/content/ratgeber";
import { CostPerYearCalculator } from "./CostPerYearCalculator";
import { InlineText } from "./InlineText";

/** Renders the sections of an article. Styling lives here, because the content is plain data. */
export function ArticleBody({ sections }: { sections: readonly ArticleSection[] }) {
  return (
    <div>
      {sections.map((section, index) => (
        <section key={section.id} aria-labelledby={section.id} className="mt-14 first:mt-0">
          <h2
            id={section.id}
            className="scroll-mt-28 font-semiwide text-[1.5rem] font-bold leading-tight tracking-[-0.005em] text-graphit text-balance sm:text-[1.75rem]"
          >
            <span aria-hidden="true" className="mr-3 align-[0.2em] font-mono text-xs font-medium tracking-[0.1em] text-kreide">
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.heading}
          </h2>
          {section.blocks.map((block, blockIndex) => (
            <Block key={blockIndex} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="mt-4 text-[1.0625rem] leading-[1.75] text-graphit-soft">
          <InlineText text={block.text} />
        </p>
      );
    case "list":
      return block.ordered ? (
        <ol className="mt-5 space-y-4">
          {block.items.map((item, index) => (
            <li key={item} className="grid grid-cols-[2.25rem_1fr] text-[1.0625rem] leading-[1.7] text-graphit-soft">
              <span aria-hidden="true" className="pt-[0.2em] font-mono text-sm text-kreide">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <InlineText text={item} />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {block.items.map((item) => (
            <li
              key={item}
              className="relative pl-6 text-[1.0625rem] leading-[1.7] text-graphit-soft before:absolute before:left-0 before:top-[0.85em] before:h-px before:w-3 before:bg-kreide"
            >
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
    case "note":
      return (
        <div className="mt-6 border-l-2 border-kreide bg-blatt px-5 py-4">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-kreide sm:text-xs">{block.label}</p>
          <p className="mt-2 text-[1.0625rem] leading-[1.7] text-graphit">
            <InlineText text={block.text} />
          </p>
        </div>
      );
    case "table":
      return <ResponsiveTable block={block} />;
    case "calculator":
      return <CostPerYearCalculator />;
  }
}

/**
 * A real table from `md` up; below that the same rows as a definition list, so nothing has to
 * scroll sideways at 360 px. Only one of the two is displayed (the other is display:none and
 * therefore also hidden from assistive technology).
 */
function ResponsiveTable({ block }: { block: Extract<ArticleBlock, { type: "table" }> }) {
  const [rowHeader, ...columns] = block.head;
  return (
    <figure className="mt-6">
      <table className="hidden w-full border-collapse border border-strich bg-blatt text-left text-[0.95rem] md:table">
        <caption className="caption-top pb-2 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-graphit-muted sm:text-xs">
          {block.caption}
        </caption>
        <thead>
          <tr className="border-b border-graphit">
            {block.head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className="px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-graphit-muted"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-strich">
          {block.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th key={index} scope="row" className="px-4 py-3 align-top font-semibold text-graphit">
                    {cell}
                  </th>
                ) : (
                  <td key={index} className="px-4 py-3 align-top leading-snug text-graphit-soft">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="md:hidden">
        <p className="pb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-graphit-muted">{block.caption}</p>
        <ul className="divide-y divide-dashed divide-strich border border-strich bg-blatt">
          {block.rows.map((row) => (
            <li key={row[0]} className="px-4 py-3.5">
              <p className="font-semibold text-graphit">
                <span className="sr-only">{rowHeader}: </span>
                {row[0]}
              </p>
              <dl className="mt-1.5 space-y-1.5 text-[0.95rem] leading-snug">
                {columns.map((column, index) => (
                  <div key={column}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-graphit-muted">{column}</dt>
                    <dd className="text-graphit-soft">{row[index + 1]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
