"use server";

import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { authActionClient } from "@/safe-action";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PasswordSchema } from "@/lib/zod";
import z from "zod";
import bcrypt from "bcryptjs";

export const editProfileAbout = authActionClient
  .schema(z.object({
    newAbout: z.nullable(z.string())
  }))
  .action(async ({
    parsedInput: { newAbout },
    ctx: { user }
  }) => {
    await db.update(userTable)
      .set({ about: newAbout || null })
      .where(eq(userTable.id, user.id!));

    revalidatePath(`/user/${user.id!}`);

    return {
      success: true as const,
      message: "Successfully updated about section!",
      about: newAbout
    }
  });

export const changePassword = authActionClient
  .schema(z.object({ password: PasswordSchema }))
  .action(async ({
    ctx: { user },
    parsedInput: { password }
  }) => {
    const foundUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, user.id!),
      columns: {
        id: true,
        password: true
      }
    });

    if (!foundUser) throw new Error("User does not exist.");
    if (!foundUser.password) throw new Error("OAuth users do not have a password. If you are trying to change your password, change it through the associated provider.");

    // hash the password before inserting into db
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await db.update(userTable)
      .set({ password: hashedPassword })
      .where(eq(userTable.id, user.id!));

    return {
      success: true as const,
      message: "Password successfully changed!"
    };
  });
