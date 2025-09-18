import { auth } from "@/auth";
import { db } from "@/db";
import { diet, meal, mealToRecipe, nutrition, plan, planToMeal, recipe, recipeToDiet, recipeToNutrition } from "@/db/schema";
import { getCachedData } from "@/lib/actions/redis";
import { MealType } from "@/lib/types";
import { startOfDay } from "date-fns";
import { eq, sql, asc, and, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import UpcomingPlanInfo from "@/components/dashboard/upcoming-plan-info";
import z from "zod/v4";
import { SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UpcomingPlanSchema } from "@/lib/zod/dashboard";

const MAX_DIET_DISPLAY_LIMIT = 3;

export default async function UpcomingPlan() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const now = new Date();
  const upcomingPlan = await getCachedData({
    cacheKey: `user_${userId}_upcoming_plan`,
    timeToLive: 60 * 10, // 10 minutes
    schema: z
      .array(UpcomingPlanSchema)
      .max(1)
      .transform((val) => val.length > 0 ? val[0] : undefined),
    call: () => {
      const dietSubQuery = db.select({
        diet: sql`
          json_build_object(
            'id', ${diet.id},
            'name', ${diet.name},
            'description', ${diet.description}
          )
        `.as("diet")
      }).from(recipeToDiet)
        .where(eq(recipeToDiet.recipeId, recipe.id))
        .innerJoin(diet, eq(recipeToDiet.dietId, diet.id))
        .limit(MAX_DIET_DISPLAY_LIMIT)
        .as("diet_sub");

      const recipeToDietSubQuery = db.select({
        diets: sql`coalesce(json_agg(${dietSubQuery.diet}), '[]'::json)`.as("diets")
      }).from(dietSubQuery)
        .as("recipe_to_diet_sub");

      const nutritionSubQuery = db.select({ name: nutrition.name })
        .from(nutrition)
        .where(and(
          eq(nutrition.name, "Calories"),
          eq(nutrition.id, recipeToNutrition.nutritionId)
        ))
        .limit(1)
        .as("nutrition_sub");

      const recipeToNutritionSubQuery = db.select({
        calories: recipeToNutrition.amount
      }).from(recipeToNutrition)
        .where(eq(recipeToNutrition.recipeId, recipe.id))
        .innerJoinLateral(nutritionSubQuery, sql`true`)
        .as("recipe_to_nutrition_sub");
      
      const recipeSubQuery = db.select({
        recipe: sql`
          json_build_object(
            'id', ${recipe.id},
            'image', ${recipe.image},
            'title', ${recipe.title},
            'tags', ${recipe.tags},
            'description', ${recipe.description},
            'prepTime', ${recipe.prepTime}::integer,
            'calories', coalesce(${recipeToNutritionSubQuery.calories}, 0),
            'diets', coalesce(${recipeToDietSubQuery.diets}, '[]'::json)
          )
        `.as("recipe")
      }).from(recipe)
        .where(eq(recipe.id, mealToRecipe.recipeId))
        .leftJoinLateral(recipeToDietSubQuery, sql`true`)
        .leftJoinLateral(recipeToNutritionSubQuery, sql`true`)
        .as("recipe_sub");

      const mealToRecipeSubQuery = db.select({
        recipes: sql`json_agg(${recipeSubQuery.recipe})`.as("recipes")
      }).from(mealToRecipe)
        .where(eq(mealToRecipe.mealId, meal.id))
        .innerJoinLateral(recipeSubQuery, sql`true`)
        .as("meal_to_recipe_sub");

      const mealSubQuery = db.select({
        id: meal.id,
        title: meal.title,
        tags: meal.tags,
        description: meal.description,
        recipes: mealToRecipeSubQuery.recipes
      }).from(meal)
        .where(eq(meal.id, planToMeal.mealId))
        .innerJoinLateral(mealToRecipeSubQuery, sql`true`)
        .as("meal_sub");

      const planToMealSubQuery = db.select({
        meals: sql`
          json_agg(
            json_build_object(
              'id', ${mealSubQuery.id},
              'title', ${mealSubQuery.title},
              'type', ${planToMeal.type},
              'tags', ${mealSubQuery.tags},
              'description', ${mealSubQuery.description},
              'recipes', ${mealSubQuery.recipes}
            )
          )
        `.as("meals")
      }).from(planToMeal)
        .where(eq(planToMeal.planId, plan.id))
        .innerJoinLateral(mealSubQuery, sql`true`)
        .as("plan_to_meal_sub");

      const planQuery = db.select({
        id: plan.id,
        date: plan.date,
        title: plan.title,
        tags: plan.tags,
        description: plan.description,
        meals: sql<{
          id: string;
          title: string;
          type: MealType;
          tags: string[];
          description: string | null;
          recipes: {
            id: string;
            title: string;
            image: string;
            tags: string[];
            description: string | null;
            prepTime: number;
            calories: number;
            diets: {
              id: string;
              name: string;
              description: string;
            }[];
          }[];
        }[]>`coalesce(${planToMealSubQuery.meals}, '[]'::json)`
      }).from(plan)
        .where(and(
          eq(plan.createdBy, userId),
          gte(plan.date, startOfDay(now))
        ))
        .innerJoinLateral(planToMealSubQuery, sql`true`)
        .orderBy(asc(plan.createdAt))
        .limit(1);

      return planQuery;
    }
  });

  if (!upcomingPlan) {
    return (
      <div className="grid">
        <h1 className="font-bold text-2xl">Upcoming Plan</h1>
        <span className="text-muted-foreground mb-3">The most recent upcoming plan will be shown here.</span>
        <div className="bg-sidebar border border-border text-muted-foreground text-center font-semibold min-h-112 flex flex-col justify-center items-center gap-6 rounded-md">
          <SearchX size={72} className="stroke-muted-foreground"/>
          <span className="text-lg">No Upcoming Plan Found!</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid gap-2">
      <h1 className="font-bold text-2xl">Upcoming Plan</h1>
      <span className="text-muted-foreground">The most recent upcoming plan will be shown here.</span>
      <UpcomingPlanInfo upcomingPlan={upcomingPlan}/>
    </div>
  );
}

export function UpcomingPlanSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="w-48 h-8 rounded-sm"/>
      <Skeleton className="w-60 h-6 rounded-sm"/>
      <Skeleton className="w-full h-112 rounded-sm"/>
    </div>
  );
}
