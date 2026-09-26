import type { Metadata } from "next";
import { LeadsView } from "@/components/werkbank/modules/LeadsView";
import { PageBody, PageHeader } from "@/components/werkbank/ui";
import { LEAD_KINDS, LEAD_STATUSES } from "@/lib/werkbank/constants";
import { getLeadsData } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Anfragen" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const leads = await getLeadsData();
  const kind = typeof params.art === "string" && LEAD_KINDS.some((item) => item.key === params.art) ? params.art : "alle";
  const status = typeof params.status === "string" && (params.status === "alle" || LEAD_STATUSES.some((item) => item.key === params.status)) ? params.status : "offen";
  const fresh = leads.filter((lead) => lead.status === "neu").length;
  return (
    <PageBody>
      <PageHeader
        title="Anfragen"
        subtitle={
          <>
            Boden-Checks, Bewerbungen, Notfälle und Abo-Anfragen von der Website ·{" "}
            <span className="tabular-nums">{leads.length}</span> gesamt, <span className="tabular-nums">{fresh}</span> neu
          </>
        }
      />
      <LeadsView leads={leads} initialKind={kind} initialStatus={status} />
    </PageBody>
  );
}
