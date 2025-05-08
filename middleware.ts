import { auth, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/interview(.*)']);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

// Protects all routes except for nextjs internals and static files
// Always run on api routes
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|static|favicon.ico|public).*)',
    // Always run for API routes
    '/api/(.*)',
  ],
}; 