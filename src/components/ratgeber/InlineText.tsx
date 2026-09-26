import Link from "next/link";
import type { ReactNode } from "react";

// Renders the tiny inline markup of Ratgeber texts: **bold** and [label](/internal-path).
// Only internal paths and anchors are allowed (enforced by the content tests).
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function InlineText({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => renderPart(part, index))}
    </>
  );
}

function renderPart(part: string, key: number): ReactNode {
  if (part.startsWith("**") && part.endsWith("**")) {
    return (
      <strong key={key} className="font-semibold text-graphit">
        {part.slice(2, -2)}
      </strong>
    );
  }
  const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
  if (link) {
    const [, label, href] = link;
    return (
      <Link
        key={key}
        href={href ?? "/"}
        className="font-medium text-kreide underline decoration-kreide/40 decoration-1 underline-offset-[3px] transition-colors hover:text-kreide-deep hover:decoration-kreide-deep"
      >
        {label}
      </Link>
    );
  }
  return part;
}
