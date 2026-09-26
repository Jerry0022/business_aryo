import type { Metadata } from "next";
import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";
import { Hero } from "@/components/site/Hero";
import { businessJsonLd, JsonLd } from "@/components/site/JsonLd";
import { Patterns } from "@/components/site/Patterns";
import { Process } from "@/components/site/Process";
import { Services } from "@/components/site/Services";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ValueBand } from "@/components/site/ValueBand";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-copper px-5 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Zum Inhalt springen
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <ValueBand />
        <Services />
        <Patterns />
        <Process />
        <About />
        <Contact />
      </main>
      <SiteFooter onHome />
      <JsonLd data={businessJsonLd()} />
    </>
  );
}
