import NextAuth from "next-auth";
import { config as nextAuthConfig } from "../auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({ ...nextAuthConfig });
