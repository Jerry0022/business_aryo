import Link from "next/link";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { analyticsEnabled } from "@/config/analytics";
import { siteConfig } from "@/config/site";
import { InstallAppButton } from "@/features/pwa/ui/InstallAppButton";
import { NAV_ITEMS } from "./content";
import { Logo } from "./Logo";

export function SiteFooter({ onHome = false }: { onHome?: boolean }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-dark border-t border-paper/10 bg-ink text-paper">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo tone="dark" href={onHome ? "#top" : "/"} />
            <p className="mt-5 text-sm leading-relaxed text-paper/65">
              Parkett verlegen, schleifen, ölen und aufarbeiten – präzise Handarbeit für Böden mit Charakter.
            </p>
          </div>
          <nav aria-label="Footer-Navigation">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={onHome ? `#${item.id}` : `/#${item.id}`}
                    className="text-paper/75 transition-colors hover:text-paper"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${siteConfig.email}`} className="text-paper/75 transition-colors hover:text-paper">
                  E-Mail
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-paper/10 pt-6 text-sm text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name} · {siteConfig.trade}
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <li className="empty:hidden">
              <InstallAppButton className="inline-flex items-center gap-1.5 font-semibold text-oak-light transition-colors hover:text-paper" />
            </li>
            <li>
              <Link href="/impressum" className="transition-colors hover:text-paper">
                Impressum
              </Link>
            </li>
            <li>
              <Link href="/datenschutz" className="transition-colors hover:text-paper">
                Datenschutz
              </Link>
            </li>
            {analyticsEnabled ? (
              <li>
                <CookieSettingsButton className="cursor-pointer transition-colors hover:text-paper" />
              </li>
            ) : null}
            <li>
              <Link href="/login" prefetch={false} className="text-paper/55 transition-colors hover:text-paper">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
