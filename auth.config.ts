import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { EmailVerificationFormSchema, SignInFormSchema } from "@/lib/zod/auth";
import { db } from "@/db";
import bcrypt from "bcryptjs";
import { account, emailVerification, session } from "@/db/schema/auth";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { encode } from "next-auth/jwt";
import { getUserAgent } from "universal-user-agent";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { user } from "@/db/schema";
import { compareEmailVerificationOTPValues, generateEmailVerification } from "@/lib/functions/verification";
import { eq } from "drizzle-orm";

const CredentialsProvider = Credentials({
  credentials: {
    email: {},
    password: {}
  },
  authorize: async (credentials) => {
    const validateSignInCredentials = SignInFormSchema.safeParse(credentials);
    if (validateSignInCredentials.success) {
      const { email, password } = validateSignInCredentials.data;
      const foundUser = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.email, email),
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
      const foundUser = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.email, email),
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
        .where(eq(user.email, email));

      // verification entry is no longer needed
      const deleteVerificationQuery = db.delete(emailVerification)
        .where(eq(emailVerification.email, email));

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
      if (!credentials) return true; // OAuth users do not need verification
      if (!user.email) return false;

      const foundUnverifiedUser = await db.query.user.findFirst({
        where: (userTable, { and, or, eq, isNull, exists, sql }) => and(
          eq(userTable.email, sql`lower(${user.email})`),
          or(
            isNull(userTable.emailVerified),
            exists(
              db.select()
                .from(emailVerification)
                .where(eq(userTable.email, sql`lower(${user.email})`))
            )
          )
        )
      });

      if (foundUnverifiedUser) {
        await generateEmailVerification({ email: user.email });
        return `/verify?id=${foundUnverifiedUser.id}`;
      }

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
