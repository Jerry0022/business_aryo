import Link from "next/link";

export interface Crumb {
  label: string;
  /** Omit for the current page. */
  href?: string;
}

export function Breadcrumb({ items }: { items: readonly Crumb[] }) {
  return (
    <nav aria-label="Brotkrümelnavigation">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] tracking-[0.08em] text-graphit-muted sm:text-xs">
        {items.map((item, index) => (
          <li key={item.label} className="flex min-w-0 items-center gap-x-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-strich-dark">
                /
              </span>
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="uppercase underline decoration-strich-dark/60 underline-offset-[3px] transition-colors hover:text-kreide hover:decoration-kreide"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="min-w-0 max-w-[16rem] truncate text-graphit sm:max-w-md">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
