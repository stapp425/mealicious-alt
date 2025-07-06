import { config as nextAuthConfig } from "../auth.config";
import NextAuth from "next-auth";

export default NextAuth(nextAuthConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"]
};
