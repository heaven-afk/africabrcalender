import { NextRequest } from "next/server";
import { GET as getCalendarFeed } from "@/app/api/calendar/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return getCalendarFeed(request);
}
