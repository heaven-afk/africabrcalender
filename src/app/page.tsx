import CalendarApp from "@/components/CalendarApp";
import { getEvents } from "@/lib/kv";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getInitialEvents = unstable_cache(
  async () => {
    const events = await getEvents();
    return events.filter((event) => !event.status || event.status === "approved");
  },
  ["public-calendar-events"],
  { revalidate: 30 }
);

export default async function HomePage() {
  try {
    const events = await getInitialEvents();
    return <CalendarApp initialEvents={events} />;
  } catch (error) {
    console.error("Failed to prepare the event calendar:", error);
    return <CalendarApp initialEvents={[]} initialLoadError />;
  }
}
