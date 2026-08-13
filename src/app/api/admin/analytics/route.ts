import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import { buildAnalyticsReport } from "@/lib/analytics-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { authorized } = await authorizeAdminRequest(request);
    if (!authorized) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    const params = request.nextUrl.searchParams;
    const end = params.get("end") ? new Date(`${params.get("end")}T23:59:59.999Z`) : new Date();
    const start = params.get("start") ? new Date(`${params.get("start")}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 86400000);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end || end.getTime() - start.getTime() > 366 * 86400000) {
      return NextResponse.json({ success: false, error: "Choose a valid range of up to 366 days." }, { status: 400 });
    }
    const report = await buildAnalyticsReport(start, end, {
      country: params.get("country") || "", source: params.get("source") || "", device: params.get("device") || "",
    });
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Analytics report failed:", error);
    const message = error instanceof Error && /analytics_(sessions|events)/.test(error.message)
      ? "Analytics tables are not ready. Run the database migration first."
      : "Analytics could not be loaded.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

