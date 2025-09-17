"use server";

import { db } from "@/db";
import { cuisine, emailVerification, passwordReset, user as userTable, userToCuisine, userToDiet, userToDishType } from "@/db/schema";
import { authActionClient } from "@/safe-action";
import { asc, count, eq, ilike } from "drizzle-orm";
import {
  ChangeCuisinePreferencesFormSchema,
  ChangeDietPreferencesFormSchema,
  ChangeDishTypePreferencesFormSchema,
  ChangeEmailFormSchema,
  ChangePasswordFormSchema,
  ChangeUsernameFormSchema
} from "@/lib/zod/settings";
import { ActionError } from "@/lib/types";
import bcrypt from "bcryptjs";
import { generatePresignedUrlForImageDelete } from "@/lib/actions/r2";
import axios from "axios";
import z from "zod/v4";
import { removeCacheKeys } from "@/lib/actions/redis";
import { CountSchema } from "@/lib/zod";

export const updateProfilePicture = authActionClient
  .inputSchema(z.string({
    error: (issue) => typeof issue.input === undefined
      ? "An image path name is required."
      : "Expected a string, but received an invalid type."
  }))
  .action(async ({
    parsedInput: imagePathname,
    ctx: { user }
  }) => {
    const foundImage = await db.query.user.findFirst({
      where: (userTable, { eq }) => eq(userTable.id, user.id),
      columns: {
        id: true,
        image: true
      }
    });

    if (!foundImage) throw new ActionError("User does not exist.");
    
    // if the user has an image that is stored in the image bucket
    if (foundImage.image?.startsWith(process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL!) && !foundImage.image.includes(imagePathname)) {
      const { url: deleteUrl } = await generatePresignedUrlForImageDelete(foundImage.image);
      await axios.delete(deleteUrl);
    }
    
    const [{ updatedImageURL }] = await db.update(userTable)
      .set({ image: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/${imagePathname}` })
      .where(eq(userTable.id, user.id))
      .returning({
        updatedImageURL: userTable.image
      });

    return {
      success: true as const,
      message: "Profile picture successfully updated!",
      updatedImageURL
    };
  });

export const updateUsername = authActionClient
  .inputSchema(ChangeUsernameFormSchema)
  .action(async ({
    parsedInput: { username },
    ctx: {
      user: { id }
    }
  }) => {
    await db.update(userTable)
      .set({ name: username })
      .where(eq(userTable.id, id));

    return {
      success: true as const,
      message: "Name successfully updated!"
    };
  });

export const updateEmail = authActionClient
  .inputSchema(ChangeEmailFormSchema.shape.email)
  .action(async ({
    parsedInput: email,
    ctx: { user }
  }) => {
    const foundEmail = await db.query.user.findFirst({
      where: (userTable, { eq }) => eq(userTable.email, email),
      columns: {
        id: true,
        email: true
      }
    });

    if (foundEmail) {
      if (foundEmail.id === user.id) throw new ActionError("You already have this email!");
      if (foundEmail.email.toLowerCase() === user.email.toLowerCase()) throw new ActionError("Another user already has this email.");
    }

    const deleteExistingEmailVerificationsQuery = db.delete(emailVerification).where(eq(emailVerification.email, user.email));
    const deleteExistingPasswordResetQuery = db.delete(passwordReset).where(eq(passwordReset.email, user.email));

    await Promise.all([deleteExistingEmailVerificationsQuery, deleteExistingPasswordResetQuery]);
    await db.update(userTable)
      .set({ email })
      .where(eq(userTable.id, user.id));
    
    return {
      success: true as const,
      message: "Email successfully changed!"
    };
  });

export const updatePassword = authActionClient
  .inputSchema(ChangePasswordFormSchema)
  .action(async ({
    ctx: { user },
    parsedInput: { 
      currentPassword,
      newPassword
    }
  }) => {
    const foundUser = await db.query.user.findFirst({
      where: (userTable, { eq }) => eq(userTable.id, user.id),
      columns: {
        id: true,
        password: true
      }
    });

    if (!foundUser) throw new ActionError("User does not exist.");
    if (!foundUser.password) throw new ActionError("This user is not eligible for a password change.");
    
    const currentCompareResult = await bcrypt.compare(currentPassword, foundUser.password);
    if (!currentCompareResult) throw new ActionError("Incorrect password.");

    const newCompareResult = await bcrypt.compare(newPassword, foundUser.password);
    if (newCompareResult) throw new ActionError("New and current passwords cannot match.");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(userTable)
      .set({ password: hashedPassword })
      .where(eq(userTable.id, user.id));

    return {
      success: true as const,
      message: "Password successfully changed!"
    };
  });

export const updateCuisinePreferences = authActionClient
  .inputSchema(ChangeCuisinePreferencesFormSchema)
  .action(async ({
    parsedInput: { preferences },
    ctx: { user }
  }) => {
    await db.delete(userToCuisine)
      .where(eq(userToCuisine.userId, user.id));

    if (preferences.length > 0) {
      await db.insert(userToCuisine)
        .values(preferences.map((p) => ({
          userId: user.id,
          cuisineId: p.id,
          preferenceScore: p.score
        })));
    }

    await removeCacheKeys(`user_${user.id}_cuisine_preferences`);

    return {
      success: true as const,
      message: "Cuisine preferences successfully updated!"
    };
  });

export const updateDietPreferences = authActionClient
  .inputSchema(ChangeDietPreferencesFormSchema)
  .action(async ({
    parsedInput: { preferences },
    ctx: { user }
  }) => {
    await db.delete(userToDiet)
      .where(eq(userToDiet.userId, user.id));
    
    const filteredPreferences = preferences.filter((p) => p.score > 0);
    if (filteredPreferences.length > 0) {
      await db.insert(userToDiet)
        .values(filteredPreferences.map((p) => ({
          userId: user.id,
          dietId: p.id,
          preferenceScore: p.score
        })));
    }

    await removeCacheKeys(`user_${user.id}_diet_preferences`);

    return {
      success: true as const,
      message: "Diet preferences successfully changed!"
    };
  });

export const updateDishTypePreferences = authActionClient
  .inputSchema(ChangeDishTypePreferencesFormSchema)
  .action(async ({
    parsedInput: { preferences },
    ctx: { user }
  }) => {
    await db.delete(userToDishType)
      .where(eq(userToDishType.userId, user.id));
    
    const filteredPreferences = preferences.filter((p) => p.score > 0);
    if (filteredPreferences.length > 0) {
      await db.insert(userToDishType)
      .values(filteredPreferences.map((p) => ({
        userId: user.id,
        dishTypeId: p.id,
        preferenceScore: p.score
      })));
    }

    await removeCacheKeys(`user_${user.id}_dish_type_preferences`);

    return {
      success: true as const,
      message: "Dish type preferences successfully changed!"
    };
  });

export async function getCuisines({ query, limit, offset }: { query: string; limit: number; offset: number; }) {
  return db.select({
    id: cuisine.id,
    icon: cuisine.icon,
    adjective: cuisine.adjective,
    description: cuisine.description
  }).from(cuisine)
    .where(ilike(cuisine.adjective, `%${query}%`))
    .orderBy(asc(cuisine.adjective))
    .limit(limit)
    .offset(offset);
}

export async function getCuisinesCount(query: string) {
  const result = await db.select({ count: count() })
    .from(cuisine)
    .where(ilike(cuisine.adjective, `%${query}%`));

  return CountSchema.parse(result);
}
