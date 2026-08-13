import { NextRequest, NextResponse } from "next/server";
import { collectAnalytics } from "@/lib/analytics-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 16_384) return NextResponse.json({ success: false }, { status: 413 });
    const body = await request.text();
    if (body.length > 16_384) return NextResponse.json({ success: false }, { status: 413 });
    let payload: unknown;
    try { payload = JSON.parse(body); } catch { return NextResponse.json({ success: false }, { status: 400 }); }
    const result = await collectAnalytics(request, payload);
    return NextResponse.json({ success: true, ...result }, { status: 202 });
  } catch (error) {
    console.error("Analytics collection failed:", error);
    return NextResponse.json({ success: false }, { status: 503 });
  }
}
