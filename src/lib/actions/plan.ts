"use server";

import { db } from "@/db";
import { and, count, eq, gte, ilike, desc, lte, sql, asc } from "drizzle-orm";
import { getDataWithCache, removeCacheKeys } from "@/lib/actions/redis";
import { meal, mealToRecipe, nutrition, plan, planToMeal, recipe, recipeToNutrition } from "@/db/schema";
import { MealType } from "@/lib/types";
import { DetailedPlanSchema, PlanCreationSchema, PlanEditionSchema } from "@/lib/zod";
import { authActionClient } from "@/safe-action";
import { getTime } from "date-fns";
import { revalidatePath } from "next/cache";
import z from "zod";
import { UTCDate } from "@date-fns/utc";

export const createPlan = authActionClient
  .schema(z.object({
    createdPlan: PlanCreationSchema
  }))
  .action(async ({
    ctx: { user },
    parsedInput: { createdPlan }
  }) => {
    const [{ planId }] = await db.insert(plan).values({
      title: createdPlan.title,
      description: createdPlan.description || undefined,
      tags: createdPlan.tags,
      createdBy: user.id,
      date: createdPlan.date
    }).returning({
      planId: plan.id
    });

    await db.insert(planToMeal).values(Object.entries(createdPlan.meals).map(([mt, m]) => ({
      planId,
      mealId: m.id,
      type: mt as MealType
    })));

    await removeCacheKeys(`user_${user.id!}_plan*`);
    
    return {
      success: true,
      message: "Plan successfully created!"
    };
  });

export const updatePlan = authActionClient
  .schema(z.object({
    editedPlan: PlanEditionSchema
  }))
  .action(async ({
    parsedInput: { editedPlan },
    ctx: { user }
  }) => {
    const foundPlan = await db.query.plan.findFirst({
      where: (plan, { eq }) => eq(plan.id, editedPlan.id),
      columns: {
        id: true,
        createdBy: true
      }
    });

    if (!foundPlan)
      throw new Error("Plan does not exist.");

    if (user.id !== foundPlan.createdBy)
      throw new Error("You are not authorized to delete this recipe.");

    const updatePlanQuery = db.update(plan)
      .set({
        title: editedPlan.title,
        tags: editedPlan.tags,
        description: editedPlan.description || null,
        date: new UTCDate(editedPlan.date),
        updatedAt: new Date()
      })
      .where(eq(plan.id, editedPlan.id));
    
    const deleteMealsQuery = db.delete(planToMeal)
      .where(eq(planToMeal.planId, editedPlan.id));

    await Promise.all([updatePlanQuery, deleteMealsQuery]);
    await db.insert(planToMeal).values(Object.entries(editedPlan.meals).map(([mt, m]) => ({
      planId: foundPlan.id,
      mealId: m.id,
      type: mt as MealType
    })));

    await removeCacheKeys(`user_${user.id!}_plan*`);

    return {
      success: true as const,
      message: "Successfully updated recipe!"
    };
  });

export const deletePlan = authActionClient
  .schema(z.object({
    planId: z.string()
      .nonempty({
        message: "Plan ID must not be empty."
      })
  }))
  .action(async ({
    parsedInput: { planId },
    ctx: { user }
  }) => {
    const foundPlan = await db.query.plan.findFirst({
      where: (plan, { eq }) => eq(plan.id, planId),
      columns: {
        id: true,
        createdBy: true
      }
    });

    if (!foundPlan)
      throw new Error("Plan does not exist.");

    if (user.id !== foundPlan.createdBy)
      throw new Error("You are not authorized to delete this recipe.");
    
    await db.delete(plan).where(eq(plan.id, foundPlan.id));
    await removeCacheKeys(`user_${user.id}_plan*`);
    revalidatePath("/plans");

    return {
      success: true as const,
      message: "Successfully deleted plan!"
    };
  });

export async function getSavedMealsForPlanForm({ userId, query, limit, offset }: { userId: string; query: string; limit: number; offset: number; }) {
  return db.select({
    id: meal.id,
    title: meal.title,
    calories: sql<number>`"meal_to_recipe_sub"."total_calories"`.as("total_calories"),
    recipes: sql<{
      id: string;
      title: string;
    }[]>`"meal_to_recipe_sub"."recipes"`.as("recipes")
  }).from(meal)
    .where(and(
      eq(meal.createdBy, userId),
      ilike(meal.title, `%${query}%`)
    ))
    .innerJoinLateral(
      db.select({
        calories: sql`sum("recipe_sub"."calories")`.as("total_calories"),
        recipes: sql`
          coalesce(
            json_agg("recipe_sub"."recipe"),
            '[]'::json
          )
        `.as("recipes")
      }).from(mealToRecipe)
        .where(eq(mealToRecipe.mealId, meal.id))
        .innerJoinLateral(
          db.select({
            calories: sql`"recipe_to_nutrition_sub"."calories"`.as("calories"),
            recipe: sql`
              json_build_object(
                'id', ${recipe.id},
                'title', ${recipe.title}
              )
            `.as("recipe")
          }).from(recipe)
            .where(eq(mealToRecipe.recipeId, recipe.id))
            .leftJoinLateral(
              db.select({
                calories: sql`coalesce(${recipeToNutrition.amount}, 0)`.as("calories")
              }).from(recipeToNutrition)
                .where(and(
                  eq(recipeToNutrition.recipeId, recipe.id),
                  eq(nutrition.name, "Calories")
                ))
                .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
                .as("recipe_to_nutrition_sub"),
              sql`true`
            )
            .as("recipe_sub"),
          sql`true`
        )
        .as("meal_to_recipe_sub"),
      sql`true`
    )
    .limit(limit)
    .offset(offset);
}

export async function getSavedMealsForPlanFormCount({ userId, query }: { userId: string, query: string }) {
  return db.select({ count: count() })
    .from(meal)
    .where(and(
      eq(meal.createdBy, userId),
      ilike(meal.title, `%${query}%`)
    ));
}

export async function getPreviewPlansInTimeFrame({ userId, startDate, endDate }: {
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  const plansQuery = db.query.plan.findMany({
    where: (plan, { and, eq, gte }) => and(
      eq(plan.createdBy, userId),
      gte(plan.date, startDate),
      lte(plan.date, endDate)
    ),
    columns: {
      id: true,
      title: true,
      date: true
    }
  });

  const plans = await getDataWithCache({
    cacheKey: `user_${userId}_plans_preview_${getTime(startDate)}_to_${getTime(endDate)}`,
    call: () => plansQuery,
    timeToLive: 120,
    schema: z.array(z.object({
      id: z.string({
        required_error: "A plan ID is required."
      }).nonempty({
        message: "Plan ID cannot be empty."
      }),
      title: z.string({
        required_error: "A plan title is required."
      }).nonempty({
        message: "Plan title cannot be empty."
      }),
      date: z.coerce.date({
        required_error: "A plan date is required."
      })
    }))
  });

  return plans;
}

export async function getPlansInTimeFrameCount({ userId, startDate, endDate, query }: { 
  userId: string;
  startDate?: Date;
  endDate?: Date;
  query?: string;
}) {
  const plansQuery = db.select({
    count: count()
  }).from(plan)
    .where(and(
      eq(plan.createdBy, userId),
      startDate ? gte(plan.date, startDate) : undefined,
      endDate ? lte(plan.date, endDate) : undefined,
      query ? ilike(plan.title, query) : undefined
    ))

  return await getDataWithCache({
    cacheKey: `user_${userId}_plans_count${startDate ? `_${getTime(startDate)}` : ""}${endDate ? `_to_${getTime(endDate)}` : ""}${query ? `_query_${query}` : ""}`,
    call: () => plansQuery,
    schema: z.array(z.object({
      count: z.number({
        required_error: "A count amount is required.",
        invalid_type_error: "Expected a number from count."
      }).int({
        message: "Count must be an integer."
      }).nonnegative({
        message: "Count cannot be negative."
      })
    })).length(1, {
      message: "Count array must only have 1 element."
    }),
    timeToLive: 120
  });
}

export async function getDetailedPlansInTimeFrame({ userId, planId, startDate, endDate, query, limit, offset }: { 
  userId: string;
  planId?: string;
  startDate?: Date;
  endDate?: Date;
  query?: string;
  limit?: number;
  offset?: number;
}) {
  if (startDate && endDate && startDate > endDate)
    throw new Error("Start date cannot be later than end date.");
  
  const recipeSubquery = db.select({
    recipe: sql`
      json_build_object(
        'id', ${recipe.id},
        'title', ${recipe.title},
        'calories', "recipe_to_nutrition_sub"."calories",
        'image', ${recipe.image},
        'description', ${recipe.description}
      )
    `.as("recipe")
  }).from(recipe)
    .leftJoinLateral(
      db.select({
        calories: sql`coalesce(${recipeToNutrition.amount}, 0)`.as("calories")
      }).from(recipeToNutrition)
        .where(and(
          eq(recipeToNutrition.recipeId, recipe.id),
          eq(nutrition.name, "Calories")
        ))
        .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
        .as("recipe_to_nutrition_sub"),
      sql`true`
    );
  
  const mealSubquery = db.select({
    id: meal.id,
    title: meal.title,
    tags: meal.tags,
    description: meal.description,
    recipes: sql`"meal_to_recipe_sub"."recipes"`
  }).from(meal)
    .innerJoinLateral(
      db.select({
        recipes: sql`json_agg("recipe_sub"."recipe")`.as("recipes")
      }).from(mealToRecipe)
        .where(eq(mealToRecipe.mealId, meal.id))
        .innerJoinLateral(
          recipeSubquery
            .where(eq(mealToRecipe.recipeId, recipe.id))
            .as("recipe_sub"),
          sql`true`
        )
        .as("meal_to_recipe_sub"),
      sql`true`
    );

  const plansQuery = db.select({
    id: plan.id,
    title: plan.title,
    date: plan.date,
    tags: plan.tags,
    description: plan.description,
    meals: sql<{
      id: string;
      title: string;
      tags: string[];
      description: string | null;
      type: MealType;
      recipes: {
        id: string;
        title: string;
        image: string;
        calories: number;
        description: string;
      }[];
    }[]>`"plan_to_meal_sub"."meals"`
  }).from(plan)
    .where(and(
      eq(plan.createdBy, userId),
      planId ? eq(plan.id, planId) : undefined,
      startDate ? gte(plan.date, startDate) : undefined,
      endDate ? lte(plan.date, endDate) : undefined,
      query ? ilike(plan.title, `%${query}%`) : undefined
    ))
    .innerJoinLateral(
      db.select({
        meals: sql`
          coalesce(
            json_agg(
              json_build_object(
                'id', "meal_sub"."meal_id",
                'title', "meal_sub"."meal_title",
                'type', ${planToMeal.type},
                'tags', "meal_sub"."meal_tags",
                'description', "meal_sub"."meal_desc",
                'recipes', "meal_sub"."recipes"
              )
            ),
            '[]'::json
          )
        `.as("meals"),
      }).from(planToMeal)
        .where(eq(planToMeal.planId, plan.id))
        .innerJoinLateral(
          mealSubquery
            .where(eq(planToMeal.mealId, meal.id))
            .as("meal_sub"),
          sql`true`
        )
        .as("plan_to_meal_sub"),
      sql`true`
    )
    .limit(limit ? limit : 10000)
    .offset(offset ? offset : 0)
    .orderBy(endDate && endDate < new Date() ? desc(plan.date) : asc(plan.date));
  
  return await getDataWithCache({
    cacheKey: `user_${userId}_plans${planId ? planId : ""}_detailed${startDate ? `_${getTime(startDate)}` : ""}${endDate ? `_to_${getTime(endDate)}` : ""}${query ? `_query_${query}` : ""}${limit ? `_limit_${limit}` : ""}${offset ? `_offset_${offset}` : ""}`,
    schema: DetailedPlanSchema,
    call: () => plansQuery,
    timeToLive: 120
  });
}
