"use server";

import { db } from "@/db";
import { emailVerification } from "@/db/schema";
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
    html: `<p>Welcome to Mealicious! Your verification code is ${code}. This code will expire in ${getDateDifference({ earlierDate: new Date(), laterDate: expirationDate })}.</p>`
  });

  return {
    success: true,
    message: "Email verification successfully created!"
  };
}

export async function compareOTPValues({ 
  email,
  code,
  codeLength = 6
}: {
  email: string,
  code: string,
  codeLength?: number
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

  const compareResult = await bcrypt.compare(String(code).padStart(codeLength, "0"), foundVerification.code);
  return compareResult;
}
