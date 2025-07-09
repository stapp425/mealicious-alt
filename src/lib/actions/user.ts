"use server";

import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { authActionClient } from "@/safe-action";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import z from "zod";

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