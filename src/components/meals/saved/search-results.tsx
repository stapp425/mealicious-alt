import { db } from "@/db";
import { Skeleton } from "@/components/ui/skeleton";
import { meal, mealToRecipe, nutrition, recipe, recipeToNutrition } from "@/db/schema";
import { and, eq, ilike, lte, sql } from "drizzle-orm";
import { MAX_MEAL_DISPLAY_LIMIT } from "@/lib/utils";
import { SearchX } from "lucide-react";
import { MealType } from "@/lib/types";
import MealResult from "./meal-result";

type SearchResultsProps = {
  count: number;
  userId: string;
  searchParams: {
    page: number;
    query: string;
    mealType: MealType | null;
    maxCalories: number;
  };
};

export default async function SearchResults({ count, userId, searchParams }: SearchResultsProps) {
  const { page, query, maxCalories } = searchParams;
  const meals = await db.select({
    id: meal.id,
    title: meal.title,
    description: meal.description,
    tags: meal.tags,
    calories: sql<number>`"meal_to_recipe_sub"."total_calories"`,
    recipes: sql<{
      id: string;
      title: string;
      image: string;
      description: string | null;
    }[]>`"meal_to_recipe_sub"."data"`
  }).from(meal)
    .where(and(
      eq(meal.createdBy, userId),
      query ? ilike(meal.title, `%${query}%`) : undefined,
      maxCalories > 0 ? lte(sql`"meal_to_recipe_sub"."total_calories"`, maxCalories) : undefined
    ))
    .innerJoinLateral(
      db.select({
        sum: sql`sum("recipe_sub"."calories")`.as("total_calories"),
        data: sql`
          coalesce(
            json_agg("recipe_sub"."data"),
            '[]'::json
          )
        `.as("data")
      }).from(mealToRecipe)
      .where(eq(mealToRecipe.mealId, meal.id))
      .leftJoinLateral(
        db.select({
          calories: sql`"recipe_to_nutrition_sub"."calories"`.as("calories"),
          data: sql`
            json_build_object(
              'id', ${recipe.id},
              'title', ${recipe.title},
              'image', ${recipe.image},
              'description', ${recipe.description}
            )
          `.as("data")
        }).from(recipe)
          .where(eq(mealToRecipe.recipeId, recipe.id))
          .innerJoinLateral(
            db.select({
              calories: sql`coalesce(${recipeToNutrition.amount}, 0)`.as("calories")
            }).from(recipeToNutrition)
              .where(
                and(
                  eq(recipeToNutrition.recipeId, recipe.id),
                  eq(nutrition.name, "Calories")
                )
              )
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
    .limit(MAX_MEAL_DISPLAY_LIMIT)
    .offset(page * MAX_MEAL_DISPLAY_LIMIT);
  
  return (
    <div className="flex-1 flex flex-col gap-3">
      <h2 className="font-bold text-2xl">
        Search Results ({count})
      </h2>
      {
        meals.length > 0 ? (
          <div className="columns-1 @min-2xl:columns-2 *:break-inside-avoid space-y-3 @min-2xl:space-y-5">
            {meals.map((m) => <MealResult key={m.id} meal={m}/>)}
          </div> 
        ) : (
          <div className="bg-sidebar border border-border w-full flex flex-col justify-center items-center gap-6 py-10 px-8 rounded-md">
            <SearchX size={60} className="stroke-muted-foreground"/>
            <div className="flex flex-col items-center gap-2">
              <h3 className="font-bold text-lg mt-auto">No Meal Found!</h3>
              <span className="font-semibold text-center text-muted-foreground">Try making another search or start creating one!</span>
            </div>
          </div>
        )
      }
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-3">
      <Skeleton className="w-58 h-9 rounded-sm"/>
      <Skeleton className="w-84 h-6 rounded-sm"/>
      <div className="w-full grid @min-2xl:grid-cols-2 gap-3">
        {
          Array.from({ length: MAX_MEAL_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
            <Skeleton key={i} className="h-124 rounded-md"/>
          ))
        }
      </div>
    </div>
  );
}
