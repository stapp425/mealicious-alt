import { NextAuthConfig, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { SignInFormSchema } from "@/lib/zod";
import { db } from "@/db";
import bcrypt from "bcryptjs";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { user } from "./src/db/schema/user";
import { account, session } from "./src/db/schema/auth";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { encode } from "next-auth/jwt";
import { getUserAgent } from "universal-user-agent";
import { eq } from "drizzle-orm";

const CredentialsProvider = Credentials({
  credentials: {
    email: {},
    password: {}
  },
  authorize: async (credentials) => {    
    const parsedCredentials = SignInFormSchema.safeParse(credentials);

    if (!parsedCredentials.success)
      return null;

    const { email, password } = parsedCredentials.data;
    
    const foundUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.email, email)
    });

    // since this is the credentials provider, password CANNOT be NULL
    if (!foundUser || !foundUser.password)
      return null;

    if (!await bcrypt.compare(password, foundUser.password))
      return null;

    return foundUser as User;
  }
});

export const config = {
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session
  }),
  providers: [Google, GitHub, CredentialsProvider],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ 
      auth, 
      request: { 
        nextUrl
      }
    }) => {
      const { pathname } = nextUrl;
      
      const isLoggedIn = !!auth?.user;
      const isInLanding = pathname === "/";
      const isInAuthPortal = /^\/(login|register)$/.test(pathname);
      
      if (isLoggedIn) {
        if (isInLanding || isInAuthPortal)
          return NextResponse.redirect(new URL("/dashboard", nextUrl));

        return true;
      } else {
        if (!isInAuthPortal)
          return false;
      }

      return NextResponse.next();
    },
    jwt: async ({ token, account }) => {
      if (account?.provider === "credentials")
        token.isUsingCredentials = true;

      return token;
    },
    session: async ({ session, user }) => {
      session.user.id = user.id;
      return session;
    }
  },
  events: {
    createUser: async ({ user: createdUser }) => {
      if (!createdUser.id || !createdUser.email) throw new Error("User does not exist!");
      const username = createdUser.email.split("@")[0];

      const foundUser = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, createdUser.id!),
        columns: {
          id: true,
          nickname: true
        }
      });

      if (!foundUser?.nickname) {
        await db.update(user)
          .set({ nickname: username })
          .where(eq(user.id, createdUser.id));
      }
    }
  },
  jwt: {
    encode: async (params) => {
      const sessionToken = uuid();
      
      if (!params.token?.isUsingCredentials) return encode(params);
      if (!params.token?.sub) throw new Error("Could not generate a user token since a user ID was not found!");

      const [createdSession] = await db
        .insert(session)
        .values({
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30-day expiration
          userId: params.token.sub,
          sessionToken: sessionToken,
          userAgent: getUserAgent()
        }).returning();

      if (!createdSession) throw new Error("A session was not able to be created!");

      return sessionToken;
    }
  }
} satisfies NextAuthConfig;