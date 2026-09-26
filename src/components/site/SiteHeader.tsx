"use client";

import { Mail, Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { siteConfig } from "@/config/site";
import { NAV_ITEMS } from "./content";
import { Logo } from "./Logo";

interface SiteHeaderProps {
  /** "overlay" starts transparent on top of the dark hero; "solid" is always light. */
  variant?: "overlay" | "solid";
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getScrolled = () => window.scrollY > 24;
const getServerScrolled = () => false;
const subscribeNothing = () => () => {};

export function SiteHeader({ variant = "overlay" }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled);
  // true only after hydration — lets e2e tests wait until the page is interactive.
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuId = useId();

  const onHome = variant === "overlay";
  const hrefFor = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  const solid = !onHome || scrolled || open;

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) close(false);
    };
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  return (
    <>
      <header
        data-solid={solid ? "true" : "false"}
        data-hydrated={hydrated ? "true" : undefined}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-500 ease-out-soft ${
          solid
            ? "bg-paper/90 text-ink shadow-[0_1px_0_rgb(23_19_15/0.08)] backdrop-blur-xl"
            : "bg-transparent text-paper"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-20 lg:px-12">
          <Logo tone={solid ? "light" : "dark"} href={onHome ? "#top" : "/"} onClick={() => close(false)} />

          <nav aria-label="Hauptnavigation" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={hrefFor(item.id)}
                    className={`relative rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors ${
                      solid
                        ? "text-ink-soft hover:bg-sand hover:text-ink"
                        : "text-paper/85 hover:bg-paper/10 hover:text-paper"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={hrefFor("kontakt")}
              className="hidden items-center rounded-full bg-copper px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_8px_24px_-12px_rgb(216_113_44/0.9)] transition hover:bg-oak-light sm:inline-flex"
            >
              Angebot anfragen
            </a>
            <button
              ref={buttonRef}
              type="button"
              className={`inline-flex size-11 items-center justify-center rounded-full transition-colors lg:hidden ${
                solid ? "text-ink hover:bg-sand" : "text-paper hover:bg-paper/10"
              }`}
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Menü schließen" : "Menü öffnen"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Sibling of <header>: its backdrop-filter would otherwise become the containing block. */}
      <div
        id={menuId}
        hidden={!open}
        className="site-menu site-light fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-paper text-ink lg:hidden"
      >
        <nav aria-label="Mobile Navigation" className="flex min-h-full flex-col px-5 pb-10 pt-6 sm:px-8">
          <ol className="divide-y divide-ink/10 border-y border-ink/10">
            {NAV_ITEMS.map((item, index) => (
              <li key={item.id}>
                <a
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={hrefFor(item.id)}
                  onClick={() => close(false)}
                  className="group flex items-baseline gap-4 py-4 font-display text-[2rem] leading-tight tracking-[-0.01em] text-ink"
                >
                  <span className="font-sans text-xs font-semibold tabular-nums text-oak-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
          <div className="mt-auto flex flex-col gap-3 pt-10">
            <a
              href={hrefFor("kontakt")}
              onClick={() => close(false)}
              className="inline-flex items-center justify-center rounded-full bg-copper px-6 py-4 text-base font-semibold text-ink"
            >
              Angebot anfragen
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-4 text-base font-medium text-ink"
            >
              <Mail className="size-4" aria-hidden="true" />
              {siteConfig.email}
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}
