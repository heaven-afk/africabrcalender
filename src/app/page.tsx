import CalendarApp from "@/components/CalendarApp";
import { getEvents } from "@/lib/kv";
import { getPublicEvents } from "@/lib/publicEvents";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getInitialEvents = unstable_cache(
  async () => {
    const events = await getEvents();
    return getPublicEvents(events);
  },
  ["public-calendar-events"],
  { revalidate: 30 }
);

export default async function HomePage() {
  let events: Awaited<ReturnType<typeof getInitialEvents>> = [];
  let initialLoadError = false;

  try {
    events = await getInitialEvents();
  } catch (error) {
    console.error("Failed to prepare the event calendar:", error);
    initialLoadError = true;
  }

  return <CalendarApp initialEvents={events} initialLoadError={initialLoadError} />;
}
