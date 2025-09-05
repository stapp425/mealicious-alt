"use server";

import { authActionClient } from "@/safe-action";
import { CreateMealFormSchema, EditMealFormSchema } from "@/lib/zod/meal";
import { db } from "@/db";
import { meal, mealToRecipe, recipe, savedRecipe } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { and, count, desc, eq, exists, ilike, sql } from "drizzle-orm";
import { ActionError } from "@/lib/types";
import z from "zod/v4";
import { CountSchema } from "../zod";

export const createMeal = authActionClient
  .inputSchema(CreateMealFormSchema)
  .action(async ({
    ctx: { user },
    parsedInput: createdMeal
  }) => {
    const [{ mealId }] = await db.insert(meal)
      .values({
        title: createdMeal.title,
        description: createdMeal.description || undefined,
        createdBy: user.id,
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
    revalidatePath("/plans");

    return {
      success: true as const,
      message: "Meal successfully created!"
    };
  });

export const updateMeal = authActionClient
  .inputSchema(EditMealFormSchema)
  .action(async ({ ctx: { user }, parsedInput: editedMeal }) => {
    const foundMeal = await db.query.meal.findFirst({
      where: (meal, { eq }) => eq(meal.id, editedMeal.id),
      columns: {
        id: true,
        createdBy: true
      }
    });

    if (!foundMeal) throw new ActionError("Meal does not exist.");
    if (foundMeal.createdBy !== user.id) throw new ActionError("You are not authorized to edit this meal.");

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
    revalidatePath("/plans");

    return {
      success: true as const,
      message: "Meal successfully edited!"
    };
  });

export const deleteMeal = authActionClient
  .inputSchema(z.object({
    mealId: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A meal id is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Meal ID cannot be empty."
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

    if (!foundMeal) throw new ActionError("Meal does not exist.");
    if (foundMeal.createdBy !== user.id) throw new ActionError("You are not authorized to delete this meal.");

    await db.delete(meal).where(eq(meal.id, foundMeal.id));

    revalidatePath("/meals");
    revalidatePath("/plans");

    return {
      success: true as const,
      message: "Meal successfully deleted!"
    };
  });

export async function getSavedRecipesForMealForm({
  userId,
  query,
  limit,
  offset
}: {
  userId: string;
  query: string;
  limit: number;
  offset: number;
}) {
  const [savedRecipes] = await db.select({
    recipes: sql<{
      id: string;
      title: string;
      image: string;
      description: string | null;
    }[]>`
      coalesce(
        json_agg("saved_recipe_sub"."data"),
        '[]'::json
      )
    `.as("recipes")
  }).from(
      db.select({ 
        data: sql`
          json_build_object(
            'id', ${recipe.id},
            'title', ${recipe.title},
            'image', ${recipe.image},
            'description', ${recipe.description}
          )
        `.as("data")
      }).from(savedRecipe)
        .where(and(
          eq(savedRecipe.userId, userId),
          ilike(recipe.title, `%${query}%`)
        ))
        .innerJoin(recipe, eq(savedRecipe.recipeId, recipe.id))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(savedRecipe.saveDate))
        .as("saved_recipe_sub")
    );

  return savedRecipes?.recipes;
}

export async function getSavedRecipesForMealFormCount({ userId, query }: { userId: string, query: string }) {
  const countQuery = await db.select({ count: count() })
    .from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, userId),
      exists(
        db.select({ title: recipe.title })
          .from(recipe)
          .where(and(
            eq(savedRecipe.recipeId, recipe.id),
            ilike(recipe.title, `%${query}%`)
          ))
      )
    ));

  return CountSchema.parse(countQuery);
}
