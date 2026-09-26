import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LOGO_PLANKS } from "./logo-data";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#17130f" />
      {LOGO_PLANKS.map(([points, fill]) => (
        <polygon key={points} points={points} fill={fill} stroke="#17130f" strokeWidth="0.6" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

interface LogoProps {
  href?: string;
  /** Colour scheme of the surface the logo sits on. */
  tone?: "light" | "dark";
  onClick?: () => void;
}

export function Logo({ href = "/", tone = "light", onClick }: LogoProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group inline-flex items-center gap-3 rounded-lg"
      aria-label={`${siteConfig.name} – ${siteConfig.trade}, zur Startseite`}
    >
      <LogoMark className="size-9 shrink-0 transition-transform duration-500 ease-out-soft group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[1.15rem] font-semibold tracking-[-0.01em] ${tone === "dark" ? "text-paper" : "text-ink"}`}
        >
          {siteConfig.name}
        </span>
        <span
          className={`mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] ${tone === "dark" ? "text-oak-light" : "text-oak-deep"}`}
        >
          {siteConfig.trade}
        </span>
      </span>
    </Link>
  );
}
