"use server";

import z from "zod";
import { SignInFormSchema, SignUpFormSchema } from "@/lib/zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import bcrypt from "bcryptjs";
import { signIn, signOut as authSignOut } from "@/auth";
import { AuthError } from "next-auth";

export type ActionResult<T = string> = {
  success: true,
  message: string,
  data?: T
} | {
  success: false,
  error: string
};

export async function signUp(signUpData: z.infer<typeof SignUpFormSchema>): Promise<ActionResult> {
  const parsedSignUpData = SignUpFormSchema.safeParse(signUpData);

  if (!parsedSignUpData.success) {
    return {
      success: false,
      error: parsedSignUpData.error.errors[0].message
    }
  }

  const foundUserWithName = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.name, signUpData.name),
    columns: {
      name: true
    }
  });

  if (foundUserWithName) {
    return {
      success: false,
      error: "The entered username already exists."
    };
  }
  
  const foundUserWithEmail = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, signUpData.email),
    columns: {
      email: true
    }
  });

  if (foundUserWithEmail) {
    return {
      success: false,
      error: "The entered e-mail already exists."
    };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(signUpData.password, salt);

  await db
    .insert(user)
    .values({
      name: signUpData.name,
      email: signUpData.email,
      password: hashedPassword
    });
  
  return {
    success: true,
    message: "User successfully created!"
  };
}

export async function signInWithCredentials({ email, password }: z.infer<typeof SignInFormSchema>): Promise<ActionResult> {
  try {
    await signIn("credentials", { 
      email,
      password,
      redirectTo: "/dashboard"
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return {
          success: false,
          error: "Invalid username or password."
        };
      }
    }

    // mainly for handling redirect
    throw err;
  }

  return {
    success: true,
    message: "User successfully logged in!"
  };
}

export async function signOut() {
  await authSignOut({
    redirectTo: "/login"
  });
}