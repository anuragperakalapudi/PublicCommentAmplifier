import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

// Routes that require sign-in once Clerk is configured.
const isProtectedRoute = createRouteMatcher([
  "/feed(.*)",
  "/regulation(.*)",
  "/saved(.*)",
  "/activity(.*)",
  "/settings(.*)",
]);

// When Clerk env vars are absent we run a passthrough middleware so the dev
// server still works without keys. This keeps the rest of Phase 1 testable.
const passthrough = (_req: NextRequest) => NextResponse.next();

const handler = clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) await auth.protect();
    })
  : passthrough;

export default handler;

export const config = {
  matcher: [
    // Skip Next internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
