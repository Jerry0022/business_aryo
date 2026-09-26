import type { Metadata } from "next";
import { ArticleCard } from "@/components/ratgeber/ArticleCard";
import { Breadcrumb } from "@/components/ratgeber/Breadcrumb";
import { DimensionLine } from "@/components/ratgeber/DimensionLine";
import { Eyebrow } from "@/components/ratgeber/Eyebrow";
import { breadcrumbJsonLd } from "@/components/ratgeber/json-ld";
import { RatgeberCta } from "@/components/ratgeber/RatgeberCta";
import { JsonLd } from "@/components/site/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { siteConfig } from "@/config/site";
import { ARTICLES, articlesByPillar, PILLARS } from "@/content/ratgeber";
import { BeraterFab } from "@/features/berater/ui/BeraterFab";

const description =
  "Worauf es beim Boden ankommt: ehrliche Antworten zu Hund und Kindern, Fußbodenheizung, Kosten pro Jahr, Raumklima, Selbstverlegen und Oberflächen.";

export const metadata: Metadata = {
  title: "Ratgeber",
  description,
  alternates: { canonical: "/ratgeber" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: siteConfig.name,
    title: `Ratgeber · ${siteConfig.name}`,
    description,
    url: "/ratgeber",
  },
};

const pad = (value: number) => String(value).padStart(2, "0");

export default function RatgeberPage() {
  const groups = articlesByPillar();
  return (
    <>
      <SiteHeader variant="solid" />
      <main id="main" className="bg-estrich pb-20 pt-28 text-graphit sm:pb-28 sm:pt-32 lg:pt-36">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <Breadcrumb items={[{ label: "Start", href: "/" }, { label: "Ratgeber" }]} />

          <header className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-16">
            <div>
              <Eyebrow>Ratgeber</Eyebrow>
              <DimensionLine label={`${ARTICLES.length} ARTIKEL · ${PILLARS.length} THEMEN`} className="mt-8 max-w-xl" />
              <h1 className="mt-4 font-wide text-[clamp(2.5rem,8vw,5.25rem)] font-extrabold leading-[0.95] tracking-[-0.02em]">
                Worauf es ankommt.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-graphit-soft sm:text-xl">
                Hier schreibe ich auf, was ich sonst auf der Baustelle und in der Sprechstunde erkläre: was ein Boden
                aushält, was er pro Jahr kostet und wo du selbst Hand anlegen kannst. Ehrlich, auch wenn die Antwort mal
                „Brauchst du nicht“ heißt.
              </p>
            </div>

            <nav aria-labelledby="themen" className="border border-graphit bg-blatt">
              <div className="flex items-center justify-between border-b border-graphit px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em]">
                <h2 id="themen" className="font-medium text-graphit">
                  Themen
                </h2>
                <span aria-hidden="true" className="text-graphit-muted">
                  Artikel
                </span>
              </div>
              <ol className="divide-y divide-dashed divide-strich">
                {groups.map(({ pillar, articles }) => (
                  <li key={pillar.key}>
                    <a
                      href={`#${pillar.key}`}
                      className="flex items-baseline gap-3 px-4 py-2.5 text-[0.95rem] text-graphit transition-colors hover:bg-estrich hover:text-kreide"
                    >
                      <span aria-hidden="true" className="font-mono text-xs text-kreide">
                        {pad(pillar.number)}
                      </span>
                      <span className="font-medium">{pillar.label}</span>
                      <span className="flex-1 translate-y-[-0.2em] border-b border-dotted border-strich-dark" aria-hidden="true" />
                      <span className="font-mono text-xs text-graphit-muted">
                        {articles.length}
                        <span className="sr-only"> Artikel</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </header>

          {groups.map(({ pillar, articles }) => (
            <section
              key={pillar.key}
              id={pillar.key}
              aria-labelledby={`${pillar.key}-title`}
              className="mt-20 scroll-mt-28 border-t border-graphit pt-6 sm:mt-24"
            >
              <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-kreide sm:text-xs">
                    Thema {pad(pillar.number)} / {pad(PILLARS.length)}
                  </p>
                  <h2
                    id={`${pillar.key}-title`}
                    className="mt-3 font-semiwide text-[1.875rem] font-extrabold leading-[1.05] tracking-[-0.01em] text-balance sm:text-4xl"
                  >
                    {pillar.label}
                  </h2>
                  <p className="mt-4 max-w-sm leading-relaxed text-graphit-soft">{pillar.lead}</p>
                </div>
                <ul className="grid gap-5">
                  {articles.map((article) => (
                    <li key={article.slug}>
                      <ArticleCard article={article} showPillar={false} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <RatgeberCta />
        </div>
      </main>
      <SiteFooter />
      <BeraterFab />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Start", path: "/" },
          { name: "Ratgeber", path: "/ratgeber" },
        ])}
      />
    </>
  );
}
