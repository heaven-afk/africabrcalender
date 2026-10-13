import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_VAPID_PUBLIC_KEY = "BEmDROyPdokhCQ_7bMM-Z8CLlefcwJwNRQmkhxQpX7OvR8KqshQ97aOnj69GQKScq58nziLj8yKzRtYRMCfxpgw";

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    DEFAULT_VAPID_PUBLIC_KEY;

  return NextResponse.json({ publicKey });
}
