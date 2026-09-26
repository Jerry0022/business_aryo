import { InlineText } from "./InlineText";

/** "Kurz gesagt" box, styled like the title block (Schriftfeld) of a technical drawing. */
export function KurzGesagt({ items }: { items: readonly string[] }) {
  return (
    <aside aria-labelledby="kurz-gesagt" className="overflow-hidden rounded-2xl border border-nuss bg-creme">
      <div className="flex items-center justify-between gap-4 border-b border-nuss px-5 py-2.5">
        <h2 id="kurz-gesagt" className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-nuss sm:text-xs">
          Kurz gesagt
        </h2>
        <span aria-hidden="true" className="font-mono text-[11px] tracking-[0.1em] text-nuss-muted">
          {String(items.length).padStart(2, "0")} PUNKTE
        </span>
      </div>
      <ul className="divide-y divide-dashed divide-fuge px-5">
        {items.map((item, index) => (
          <li key={item} className="flex gap-4 py-3.5 text-[1rem] leading-relaxed text-nuss-soft">
            <span aria-hidden="true" className="pt-0.5 font-mono text-xs text-kupfer">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <InlineText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
