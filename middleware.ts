import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  console.log("[Middleware] Checking path:", request.nextUrl.pathname);
  
  // Check for better-auth session cookie (manual check due to Next.js 15 Edge Runtime issues)
  const hasSession = request.cookies.has("better-auth.session_token");
  console.log("[Middleware] Has session cookie:", hasSession);
  
  // Redirect to login if no session cookie found (only in production)
  if (!hasSession && process.env.NODE_ENV !== "development") {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    console.log("[Middleware] Redirecting to:", loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/account", "/account/:path*", "/admin", "/partner-dashboard", "/partner-dashboard/:path*"],
};