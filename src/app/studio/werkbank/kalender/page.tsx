import type { Metadata } from "next";
import { CalendarView } from "@/components/werkbank/calendar/CalendarView";
import { PageBody } from "@/components/werkbank/ui";
import { todayKey } from "@/lib/business/calendar";
import { parseCalendarParams } from "@/lib/werkbank/calendar-view";
import { getCalendarData } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Kalender" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const now = new Date();
  const { view, date } = parseCalendarParams(await searchParams, todayKey(now));
  const data = await getCalendarData(view, date, now);
  return (
    <PageBody wide>
      <CalendarView data={data} />
    </PageBody>
  );
}
