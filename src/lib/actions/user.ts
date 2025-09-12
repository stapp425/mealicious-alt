"use server";

import { ActionError } from "@/lib/types";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { authActionClient } from "@/safe-action";
import { eq } from "drizzle-orm";
import { PasswordSchema } from "@/lib/zod/auth";
import bcrypt from "bcryptjs";
import z from "zod/v4";

export const editProfileAbout = authActionClient
  .inputSchema(z.nullable(z.string("Expected a string, but received an invalid type.")))
  .action(async ({
    parsedInput: newAbout,
    ctx: { user }
  }) => {
    await db.update(userTable)
      .set({ about: newAbout || null })
      .where(eq(userTable.id, user.id));

    return {
      success: true as const,
      message: "Successfully updated about section!",
      about: newAbout
    };
  });

export const changePassword = authActionClient
  .inputSchema(PasswordSchema)
  .action(async ({
    ctx: { user },
    parsedInput: password
  }) => {
    const foundUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, user.id!),
      columns: {
        id: true,
        password: true
      }
    });

    if (!foundUser) throw new ActionError("User does not exist.");
    if (!foundUser.password) throw new ActionError("OAuth users do not have a password. If you are trying to change your password, change it through the associated provider.");

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
