import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { EmailVerificationFormSchema, SignInFormSchema } from "@/lib/zod/auth";
import { db } from "@/db";
import bcrypt from "bcryptjs";
import { account, emailVerification, session } from "@/db/schema/auth";
import { NextResponse } from "next/server";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { user } from "@/db/schema";
import { compareEmailVerificationOTPValues } from "@/lib/functions/verification";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { encode } from "next-auth/jwt";

const CredentialsProvider = Credentials({
  credentials: {
    email: {},
    password: {}
  },
  authorize: async (credentials) => {
    const validateSignInCredentials = SignInFormSchema.safeParse(credentials);
    if (validateSignInCredentials.success) {
      const { email, password } = validateSignInCredentials.data;
      const lowercaseEmail = email.toLowerCase();
      const foundUser = await db.query.user.findFirst({
        where: (user, { eq, sql }) => eq(sql`lower(${user.email})`, lowercaseEmail),
        columns: {
          id: true,
          email: true,
          name: true,
          image: true,
          password: true
        }
      });

      // since this is the credentials provider, password CANNOT be NULL
      if (!foundUser || !foundUser.password) return null;
      if (!await bcrypt.compare(password, foundUser.password)) return null;

      const { password: hashedPassword, ...userRest } = foundUser;
      return userRest;
    }

    const validateEmailVerificationCredentials = EmailVerificationFormSchema.safeParse(credentials);
    if (validateEmailVerificationCredentials.success) {
      const { email, code } = validateEmailVerificationCredentials.data;
      const lowercaseEmail = email.toLowerCase();
      const foundUser = await db.query.user.findFirst({
        where: (user, { eq, sql }) => eq(sql`lower(${user.email})`, lowercaseEmail),
        columns: {
          id: true,
          email: true,
          name: true,
          image: true
        }
      });

      if (!foundUser) return null;

      const compareResult = await compareEmailVerificationOTPValues({ email, code });
      if (!compareResult) return null;

      // code was correct, mark the user as verified
      const updateUserQuery = db.update(user)
        .set({ emailVerified: new Date() })
        .where(eq(sql`lower(${user.email})`, lowercaseEmail));

      // verification entry is no longer needed
      const deleteVerificationQuery = db.delete(emailVerification)
        .where(eq(sql`lower(${emailVerification.email})`, lowercaseEmail));

      await Promise.all([updateUserQuery, deleteVerificationQuery]);
      return foundUser;
    }
    
    // credentials record does not match either check
    return null;
  }
});

export const config = {
  adapter: {
    ...DrizzleAdapter(db, {
      usersTable: user,
      accountsTable: account,
      sessionsTable: session
    }),
    createUser: async (createdUser) => {
      const customUser = {
        ...createdUser,
        email: createdUser.email.toLowerCase(),
        name: createdUser.email.toLowerCase().split("@")[0]
      };

      await db.insert(user).values(customUser);
      return createdUser;
    }
  },
  logger: {
    error: (err) => {
      console.error(err.message);
    }
  },
  providers: [Google, GitHub, CredentialsProvider],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "database"
  },
  callbacks: {
    authorized: ({ 
      auth, 
      request: { nextUrl }
    }) => {
      const { pathname } = nextUrl;
      
      const isLoggedIn = auth?.user;
      const isInLanding = pathname === "/";
      const isInAuthPortal = /^\/(login|register|verify).*$/.test(pathname);
      
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
    signIn: async ({ credentials, user }) => {
      if (!credentials) return true; // OAuth users do not need additional verification
      if (!user.email) return false;

      const userEmail = user.email.toLowerCase();
      const foundUnverifiedUser = await db.query.user.findFirst({
        where: (userTable, { and, or, eq, isNull, exists }) => and(
          eq(sql`lower(${userTable.email})`, userEmail),
          or(
            isNull(userTable.emailVerified),
            exists(
              db.select({ email: emailVerification.email })
                .from(emailVerification)
                .where(eq(userTable.email, userEmail))
            )
          )
        )
      });

      // unverified users should not be able to log in
      if (foundUnverifiedUser) return `/verify?id=${foundUnverifiedUser.id}`;
      return true;
    },
    jwt: async ({ token, account }) => {
      if (account?.provider === "credentials") token.isUsingCredentials = true;
      return token;
    },
    session: async ({ session, user }) => {
      session.user.id = user.id;
      return session;
    }
  },
  jwt: {
    encode: async (params) => {
      if (!params.token?.isUsingCredentials) return encode(params);
      if (!params.token?.sub) throw new Error("Could not generate a user token since a user ID was not found!");

      const sessionToken = uuid();
      const [createdSession] = await db
        .insert(session)
        .values({
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30-day expiration
          userId: params.token.sub,
          sessionToken: sessionToken
        }).returning();

      if (!createdSession) throw new Error("A session was not able to be created!");

      return sessionToken;
    }
  }
} satisfies NextAuthConfig;
