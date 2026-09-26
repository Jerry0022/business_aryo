"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { siteConfig } from "@/config/site";
import { NAV_ITEMS, resolveHref } from "./content";
import { Logo } from "./Logo";
import { ArrowIcon, buttonOnDark } from "./ui";

interface SiteHeaderProps {
  /**
   * "overlay" is the landing page (anchor links stay on the page), "solid" every other page
   * (anchor links point to "/#…"). The header itself is always solid walnut in the Werkstatt design.
   */
  variant?: "overlay" | "solid";
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getScrolled = () => window.scrollY > 8;
const getServerScrolled = () => false;
const subscribeNothing = () => () => {};

const DESKTOP_QUERY = "(min-width: 1280px)";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />}
    </svg>
  );
}

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
  const hrefFor = (href: string) => resolveHref(href, onHome);

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
      if (window.matchMedia(DESKTOP_QUERY).matches) close(false);
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
        data-solid="true"
        data-hydrated={hydrated ? "true" : undefined}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${
          scrolled || open ? "border-creme/10 bg-nuss/95 backdrop-blur-md" : "border-transparent bg-nuss"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 xl:h-[76px] xl:px-20">
          <Logo href={onHome ? "#top" : "/"} tone="dark" onClick={() => close(false)} />

          <nav aria-label="Hauptnavigation" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={hrefFor(item.href)}
                    className="whitespace-nowrap rounded-full px-3 py-2 text-[0.9375rem] font-medium text-leinen-deep transition-colors hover:bg-nuss-raised hover:text-creme"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              prefetch={false}
              className="hidden whitespace-nowrap rounded-full px-2 py-2 text-sm font-medium text-leinen-deep underline decoration-leinen-deep/30 underline-offset-4 hover:decoration-leinen-deep xl:inline-flex"
            >
              Login
            </Link>
            <span className="hidden sm:block">
              <a href={hrefFor("#boden-check")} className={`${buttonOnDark} whitespace-nowrap !min-h-10 !py-2.5`}>
                Boden-Check starten
              </a>
            </span>
            <button
              ref={buttonRef}
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full text-creme transition-colors hover:bg-nuss-raised xl:hidden"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Menü schließen" : "Menü öffnen"}
              onClick={() => setOpen((value) => !value)}
            >
              <MenuIcon open={open} />
            </button>
          </div>
        </div>
      </header>

      {/* Sibling of <header>: its backdrop-filter would otherwise become the containing block. */}
      <div
        id={menuId}
        hidden={!open}
        className="surface-nuss fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto text-creme xl:hidden"
      >
        <nav aria-label="Mobile Navigation" className="flex min-h-full flex-col px-4 pb-10 pt-4 sm:px-8">
          <ol className="border-t border-creme/15">
            {NAV_ITEMS.map((item, index) => (
              <li key={item.label} className="border-b border-creme/15">
                <a
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={hrefFor(item.href)}
                  onClick={() => close(false)}
                  className="group flex items-baseline gap-4 py-4 font-display text-[1.75rem] font-semibold leading-tight"
                >
                  <span className="font-mono text-xs font-normal text-kupfer-light">{String(index + 1).padStart(2, "0")}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
          <div className="mt-auto flex flex-col gap-3 pt-10">
            <a href={hrefFor("#boden-check")} onClick={() => close(false)} className={`${buttonOnDark} !py-4 text-base`}>
              Boden-Check starten
              <ArrowIcon />
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-creme/25 px-5 py-3 font-mono text-sm text-creme"
            >
              {siteConfig.email}
            </a>
            <Link
              href="/login"
              prefetch={false}
              onClick={() => close(false)}
              className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-creme underline underline-offset-4"
            >
              Login
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
