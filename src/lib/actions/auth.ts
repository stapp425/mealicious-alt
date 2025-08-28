"use server";

import { 
  EmailVerificationFormSchema,
  ReCaptchaResultSchema,
  ResetPasswordFormSchema,
  SignInFormSchema,
  SignUpFormSchema
} from "@/lib/zod/auth";
import { db } from "@/db";
import { passwordReset, user } from "@/db/schema";
import bcrypt from "bcryptjs";
import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { AuthError, CredentialsSignin } from "next-auth";
import { actionClient } from "@/safe-action";
import { eq } from "drizzle-orm";
import { ActionError } from "@/lib/types";
import z from "zod/v4";
import axios from "axios";
import { UrlSchema } from "@/lib/zod";
import { Route } from "next";

export const verifyEmail = actionClient
  .inputSchema(EmailVerificationFormSchema)
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
      if (err instanceof CredentialsSignin && err.type === "CredentialsSignin") throw new ActionError("Code does not match. Please try again.");
      throw err;
    }
    
    return {
      success: true as const,
      message: "Email successfully verified!"
    };
  });

export const resetPassword = actionClient
  .inputSchema(ResetPasswordFormSchema)
  .action(async ({
    parsedInput: {
      email,
      password
    }
  }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatePasswordOperation = db.update(user)
      .set({ password: hashedPassword })
      .where(eq(user.email, email));

    const deletePasswordResetOperation = db.delete(passwordReset)
      .where(eq(passwordReset.email, email));

    await Promise.all([updatePasswordOperation, deletePasswordResetOperation]);
    
    return {
      success: true as const,
      message: "Password successfully changed!"
    };
  });

export const signUp = actionClient
  .inputSchema(SignUpFormSchema)
  .action(async ({ 
    parsedInput: { 
      email,
      name,
      password
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
    
    return {
      success: true,
      message: "User successfully created!",
      verifyId: userId
    };
  });

export const signInWithCredentials = actionClient
  .inputSchema(SignInFormSchema)
  .action(async ({ 
    parsedInput: {
      email,
      password
    }
  }) => {
    try {
      const redirectUrl = UrlSchema.parse(await authSignIn("credentials", { 
        email,
        password,
        redirect: false
      }));
      
      const url = new URL(redirectUrl);
      
      const callbackUrl = new URL(UrlSchema.parse(
        url.pathname.startsWith("/verify")
          ? url.href // unverified users must immediately be redirected for verification
          : url.searchParams.get("callbackUrl") ?? `${url.origin}/dashboard`
      ));

      return {
        success: true as const,
        redirectUrl: callbackUrl.href as Route
      };
    } catch (err) {
      if (err instanceof AuthError && err.type === "CredentialsSignin") throw new ActionError("Invalid username or password.");
      throw err;
    }
  });

export const verifyCaptcha = actionClient
  .inputSchema(
    z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A token is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Token cannot be left empty."
    })
  )
  .action(async ({ parsedInput: token }) => {
    const url = new URL("https://www.google.com/recaptcha/api/siteverify");
    url.searchParams.append("secret", process.env.RECAPTCHA_SITE_KEY_SECRET!);
    url.searchParams.append("response", token);

    const axiosResponse = await axios.post(url.toString());
    const verifyResponse = ReCaptchaResultSchema.parse(axiosResponse);

    if (!verifyResponse.success) throw new ActionError("There was an error while captcha was verifying a user action.");
    if (verifyResponse.score < 0.7) throw new ActionError("reCaptcha verification test failed, please try again later.");

    return {
      success: true as const,
      message: "Verification successful!"
    };
  });

export async function signOut() {
  await authSignOut({
    redirectTo: "/login"
  });
}
