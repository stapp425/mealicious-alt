"use server";

import { db } from "@/db";
import { emailVerification, passwordReset } from "@/db/schema";
import { resend } from "@/lib/resend";
import bcrypt from "bcryptjs";
import { isAfter } from "date-fns";
import { getDateDifference } from "@/lib/utils";

export async function generateEmailVerification({ 
  email,
  codeLength = 6,
  expireTime = 60 * 5 // 5 minutes (default)
}: {
  email: string;
  codeLength?: number;
  expireTime?: number;
}) {
  const code = String(Math.floor(Math.random() * 10 ** Math.max(0, codeLength))).padStart(codeLength, "0");
  const hashedCode = await bcrypt.hash(code, 10);
  const expirationDate = new Date(Date.now() + 1000 * expireTime);
  await db.insert(emailVerification)
    .values({
      email,
      code: hashedCode,
      expiration: expirationDate
    })
    .onConflictDoUpdate({
      target: emailVerification.email,
      set: {
        code: hashedCode,
        expiration: expirationDate
      }
    });

  await resend.emails.send({
    from: "Mealicious <no-reply@mealicious.shawntapp.com>",
    to: [email],
    subject: "Mealicious Verification Code",
    html: `<p>Welcome to Mealicious! Your verification code is <b>${code}</b>. This code will expire in ${getDateDifference({ earlierDate: new Date(), laterDate: expirationDate })}.</p>`
  });

  return {
    success: true as const,
    message: "Email verification successfully created!"
  };
}

export async function compareEmailVerificationOTPValues({ 
  email,
  code
}: {
  email: string,
  code: string
}): Promise<boolean> {
  const foundVerification = await db.query.emailVerification.findFirst({
    where: (verification, { eq }) => eq(verification.email, email),
    columns: {
      email: true,
      code: true,
      expiration: true
    }
  });

  if (!foundVerification || isAfter(Date.now(), foundVerification.expiration)) return false;

  const compareResult = await bcrypt.compare(code, foundVerification.code);
  return compareResult;
}

export async function generatePasswordResetPrompt({
  email,
  codeLength = 6,
  expireTime = 60 * 5 // 5 minutes (default)
}: {
  email: string;
  codeLength?: number;
  expireTime?: number;
}) {
  const foundUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email),
    columns: {
      id: true,
      email: true,
      emailVerified: true,
      password: true
    }
  });

  if (!foundUser) {
    return {
      success: false as const,
      error: "User does not exist."
    };
  }

  if (!foundUser.password) {
    return {
      success: false as const,
      error: "This user is ineligible for a password reset."
    };
  }
  
  if (!foundUser.emailVerified) {
    return {
      success: false as const,
      error: "This user is not verified yet."
    };
  };

  const expirationDate = new Date(Date.now() + expireTime * 1000);
  const code = String(Math.floor(Math.random() * 10 ** Math.max(0, codeLength))).padStart(codeLength, "0");
  const hashedCode = await bcrypt.hash(code, 10);

  await db.insert(passwordReset).values({
    email,
    code: hashedCode,
    expiration: expirationDate
  }).onConflictDoUpdate({
    target: passwordReset.email,
    set: {
      code: hashedCode,
      expiration: expirationDate
    }
  });

  await resend.emails.send({
    from: "Mealicious <no-reply@mealicious.shawntapp.com>",
    to: [email],
    subject: "Mealicious Password Reset",
    html: `<p>You recently requested for a password reset! Your verification code is <b>${code}</b>. This code will expire in ${getDateDifference({ earlierDate: new Date(), laterDate: expirationDate })}.</p>`
  });
  
  return {
    success: true as const,
    message: "Password reset prompt successfully created!"
  };
}

export async function comparePasswordResetOTPValues({ 
  email,
  code
}: {
  email: string,
  code: string
}): Promise<boolean> {
  const foundPasswordReset = await db.query.passwordReset.findFirst({
    where: (passwordReset, { eq }) => eq(passwordReset.email, email),
    columns: {
      email: true,
      code: true,
      expiration: true
    }
  });

  if (!foundPasswordReset || isAfter(Date.now(), foundPasswordReset.expiration)) return false;

  const compareResult = await bcrypt.compare(code, foundPasswordReset.code);
  return compareResult;
}
