import { CalendarPlus, Plus } from "lucide-react";
import type { Metadata } from "next";
import { OpenDrawer } from "@/components/werkbank/DrawerButtons";
import { ToolsView } from "@/components/werkbank/modules/ToolsView";
import { PageBody, PageHeader } from "@/components/werkbank/ui";
import { getToolsData, TOOL_TIMELINE_WEEKS } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Werkzeug" };

export default async function ToolsPage() {
  const data = await getToolsData(new Date());
  return (
    <PageBody wide>
      <PageHeader
        title="Werkzeug"
        subtitle={`Verleih für Selbermacher und Betriebe · ${data.tools.length} ${data.tools.length === 1 ? "Gerät" : "Geräte"} · Zeitleiste der nächsten ${TOOL_TIMELINE_WEEKS} Wochen`}
        actions={
          <>
            <OpenDrawer view={{ type: "entityForm", entity: "tool" }}>
              <Plus className="size-4" aria-hidden /> Werkzeug
            </OpenDrawer>
            {data.tools.length > 0 ? (
              <OpenDrawer view={{ type: "entityForm", entity: "rental" }} variant="primary">
                <CalendarPlus className="size-4" aria-hidden /> Ausgabe planen
              </OpenDrawer>
            ) : null}
          </>
        }
      />
      <ToolsView data={data} />
    </PageBody>
  );
}
