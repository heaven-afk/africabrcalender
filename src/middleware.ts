import "@/lib/clerkSanitize";
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
  !publishableKey.includes("sample_key");

export default function middleware(req: Parameters<typeof clerkMiddleware>[0] extends (infer P) ? P : any, evt: any) {
  if (!isValidClerkKey) {
    return NextResponse.next();
  }

  const handler = clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
      try {
        const authObj = await auth();
        if (typeof authObj.protect === "function") {
          authObj.protect();
        }
      } catch {
        // Dev fallback
      }
    }
  });

  return handler(req, evt);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
