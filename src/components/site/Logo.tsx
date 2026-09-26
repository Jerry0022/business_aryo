import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LOGO_ACCENT, LOGO_DIMENSION_PATH, LOGO_PLANK_SIZE, LOGO_PLANKS, LOGO_VIEWBOX } from "./logo-data";

export function LogoMark({ className, chalk = LOGO_ACCENT }: { className?: string; chalk?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {LOGO_PLANKS.map(([x, y, fill]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={LOGO_PLANK_SIZE.width} height={LOGO_PLANK_SIZE.height} fill={fill} />
      ))}
      <path d={LOGO_DIMENSION_PATH} stroke={chalk} strokeWidth="1.5" fill="none" />
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
  const dark = tone === "dark";
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group inline-flex min-h-11 items-center gap-3 rounded-lg"
      aria-label={`${siteConfig.name} – ${siteConfig.trade}, zur Startseite`}
    >
      <LogoMark
        className="h-[26px] w-[31px] shrink-0 transition-transform duration-500 ease-out-soft group-hover:-translate-y-px sm:h-[30px] sm:w-9"
        chalk={dark ? "#e9a574" : LOGO_ACCENT}
      />
      <span className="flex flex-col gap-[3px] leading-none">
        <span
          className={`whitespace-nowrap font-display text-[0.8125rem] font-semibold uppercase tracking-[0.06em] sm:text-[0.9375rem] ${
            dark ? "text-creme" : "text-nuss"
          }`}
        >
          {siteConfig.name}
        </span>
        <span
          className={`whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.12em] ${
            dark ? "text-fuge" : "text-nuss-muted"
          }`}
        >
          {siteConfig.trade} · NRW
        </span>
      </span>
    </Link>
  );
}
