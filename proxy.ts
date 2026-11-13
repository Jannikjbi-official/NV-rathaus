export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/konto/:path*", "/verwaltung/:path*"],
};
