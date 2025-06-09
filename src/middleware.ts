export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/api/groups/:path*", "/api/sessions/:path*", "/api/responses/:path*", "/api/leaderboard/:path*"]
} 