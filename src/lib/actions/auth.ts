"use server";

import { EmailVerificationFormSchema, SignInFormSchema, SignUpFormSchema } from "@/lib/zod/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import bcrypt from "bcryptjs";
import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { AuthError, CredentialsSignin } from "next-auth";
import { actionClient } from "@/safe-action";
import z from "zod";
import { generateEmailVerification } from "@/lib/functions/verification";

export const verifyEmail = actionClient
  .schema(EmailVerificationFormSchema)
  .action(async ({ 
    parsedInput: { 
      email,
      code
    }
  }) => {
    try {
      // authorize callback will handle code checking
      await authSignIn("credentials", {
        email,
        code,
        redirect: false
      });
    } catch (err) {
      if (err instanceof CredentialsSignin && err.type === "CredentialsSignin") throw new Error("Code does not match. Please try again.");
      throw err;
    }
    
    return {
      success: true as const,
      message: "User's email successfully verified!"
    };
  });

export const signUp = actionClient
  .schema(z.object({
    registerData: SignUpFormSchema
  }))
  .action(async ({ 
    parsedInput: { 
      registerData: {
        email,
        name,
        password
      }
    }
  }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [{ userId }] = await db
      .insert(user)
      .values({ 
        name,
        email,
        password: hashedPassword
      })
      .returning({
        userId: user.id
      });
    
    await generateEmailVerification({ email });
    
    return {
      success: true,
      message: "User successfully created!",
      verifyId: userId
    };
  });

export const signInWithCredentials = actionClient
  .schema(z.object({
    signInData: SignInFormSchema
  }))
  .action(async ({ 
    parsedInput: {
      signInData: {
        email,
        password
      }
    }
  }) => {
    try {
      const redirectUrl = await authSignIn("credentials", { 
        email,
        password,
        redirect: false
      });

      return {
        success: true as const,
        redirectUrl: z.string().parse(redirectUrl)
      };
    } catch (err) {
      if (err instanceof AuthError && err.type === "CredentialsSignin") throw new Error("Invalid username or password.");
      throw err;
    }
  });

export async function signOut() {
  await authSignOut({
    redirectTo: "/login"
  });
}
