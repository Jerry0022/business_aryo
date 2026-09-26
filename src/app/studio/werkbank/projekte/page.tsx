import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { OpenDrawer } from "@/components/werkbank/DrawerButtons";
import { ContingentStrip, ProjectsView } from "@/components/werkbank/modules/ProjectsView";
import { PageBody, PageHeader } from "@/components/werkbank/ui";
import { getProjectsData } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Projekte" };

export default async function ProjectsPage() {
  const data = await getProjectsData(new Date());
  return (
    <PageBody>
      <PageHeader
        title="Projekte"
        subtitle="Projektplätze kommen aus diesen Einträgen: Status „Gebucht“, „Laufend“ oder „Abgeschlossen“ mit Platz-Jahr belegt einen Platz."
        actions={
          <OpenDrawer view={{ type: "entityForm", entity: "project" }} variant="primary">
            <Plus className="size-4" aria-hidden /> Neues Projekt
          </OpenDrawer>
        }
      />
      <div className="mt-6 space-y-3">
        {data.contingents.map((contingent) => (
          <ContingentStrip key={contingent.year} contingent={contingent} />
        ))}
      </div>
      <ProjectsView projects={data.projects} />
    </PageBody>
  );
}
