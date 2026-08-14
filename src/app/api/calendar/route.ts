import { NextRequest } from "next/server";
import { generateICS, getMonthlyExportEvents } from "@/lib/calendarExport";
import { getEvents } from "@/lib/kv";
import { getPublicEvents } from "@/lib/publicEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") === "month" ? "month" : "all";
    const month = searchParams.get("month") || "";
    if (scope === "month" && !/^\d{4}-\d{2}$/.test(month)) {
      return new Response("A valid month in YYYY-MM format is required.", { status: 400 });
    }

    let events = getPublicEvents(await getEvents());
    if (scope === "month") events = getMonthlyExportEvents(events, month);

    const calendarName = scope === "month" ? `${month} Esports Calendar` : "Esports Calendar";
    const filename = scope === "month" ? `esports-calendar-${month}.ics` : "esports-calendar-full.ics";
    return new Response(generateICS(events, new Date(), calendarName), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Calendar feed generation failed:", error);
    return new Response("The calendar feed is temporarily unavailable.", { status: 500 });
  }
}
