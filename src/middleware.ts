import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/events(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isValidClerkKey =
  publishableKey &&
  publishableKey.startsWith("pk_") &&
  !publishableKey.includes("sample_key") &&
  !publishableKey.includes("\n") &&
  !publishableKey.includes("\r");

const clerkHandler = isValidClerkKey
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        try {
          const authObj = await auth();
          if (typeof authObj.protect === "function") {
            authObj.protect();
          }
        } catch {
          // Dev fallback — allow through
        }
      }
    })
  : null;

export default function middleware(
  req: Parameters<typeof clerkMiddleware>[0] extends (infer P) ? P : any,
  evt: any
) {
  try {
    if (!clerkHandler) {
      return NextResponse.next();
    }
    return clerkHandler(req, evt);
  } catch {
    // If Clerk fails (e.g. malformed key), allow the request through
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
