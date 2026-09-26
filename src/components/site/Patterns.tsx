import { PatternExplorer } from "./PatternExplorer";
import { SectionHeading } from "./SectionHeading";

export function Patterns() {
  return (
    <section id="muster" aria-labelledby="muster-title" className="site-light scroll-mt-20 bg-sand py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <SectionHeading
          id="muster-title"
          eyebrow="Muster-Explorer"
          title="Finden Sie Ihr Muster."
          className="max-w-3xl"
        >
          Das Verlegemuster prägt einen Raum mindestens so sehr wie das Holz selbst. Probieren Sie hier aus, was zu
          Ihnen passt.
        </SectionHeading>
        <div className="mt-14 lg:mt-16">
          <PatternExplorer />
        </div>
      </div>
    </section>
  );
}
