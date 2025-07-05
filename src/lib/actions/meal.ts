"use server";

import { authActionClient } from "@/safe-action";
import { MealCreationSchema, MealEditionSchema } from "@/lib/zod";
import z from "zod";
import { db } from "@/db";
import { meal, mealToRecipe } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export const createMeal = authActionClient
  .schema(z.object({
    createdMeal: MealCreationSchema
  }))
  .action(async ({
    ctx: { user },
    parsedInput: { createdMeal }
  }) => {
    const [{ mealId }] = await db.insert(meal)
      .values({
        title: createdMeal.title,
        description: createdMeal.description || undefined,
        createdBy: user.id!,
        tags: createdMeal.tags
      })
      .returning({
        mealId: meal.id
      });

    await db.insert(mealToRecipe)
      .values(createdMeal.recipes.map((r) => ({
        mealId: mealId,
        recipeId: r.id
      })));

    revalidatePath("/meals");

    return {
      success: true as const,
      message: "Meal successfully created!"
    };
  });

export const updateMeal = authActionClient
  .schema(z.object({
    editedMeal: MealEditionSchema
  }))
  .action(async ({ ctx: { user }, parsedInput: { editedMeal } }) => {
    const foundMeal = await db.query.meal.findFirst({
      where: (meal, { eq }) => eq(meal.id, editedMeal.id),
      columns: {
        id: true,
        createdBy: true
      }
    });

    if (!foundMeal)
      throw new Error("Meal does not exist.");

    if (foundMeal.createdBy !== user.id)
      throw new Error("You are not authorized to edit this meal.");

    const updateMealQuery = db.update(meal)
      .set({
        title: editedMeal.title,
        description: editedMeal.description || undefined,
        tags: editedMeal.tags,
        updatedAt: new Date()
      })
      .where(eq(meal.id, foundMeal.id));

    const deleteMealToRecipeQuery = db.delete(mealToRecipe)
      .where(eq(mealToRecipe.mealId, foundMeal.id));

    await Promise.all([
      updateMealQuery,
      deleteMealToRecipeQuery
    ]);

    await db.insert(mealToRecipe)
      .values(editedMeal.recipes.map((r) => ({
        mealId: foundMeal.id,
        recipeId: r.id
      })));

    revalidatePath("/meals");

    return {
      success: true as const,
      message: "Meal successfully edited!"
    };
  });

export const deleteMeal = authActionClient
  .schema(z.object({
    mealId: z.string().nonempty({
      message: "Meal ID cannot be empty."
    })
  }))
  .action(async ({ 
    ctx: { user },
    parsedInput: { mealId }
  }) => {
    const foundMeal = await db.query.meal.findFirst({
      where: (meal, { eq }) => eq(meal.id, mealId),
      columns: {
        id: true,
        createdBy: true
      }
    });

    if (!foundMeal)
      throw new Error("Meal does not exist.");

    if (foundMeal.createdBy !== user.id)
      throw new Error("You are not authorized to delete this meal.");

    await db.delete(meal).where(eq(meal.id, foundMeal.id));

    revalidatePath("/meals");

    return {
      success: true as const,
      message: "Meal successfully deleted!"
    };
  });