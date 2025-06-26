import { db } from "@/db";
import MealResult from "./meal-result";
import { meal, mealToRecipe, nutrition, recipe, recipeToNutrition } from "@/db/schema";
import { and, eq, ilike, lte, sql } from "drizzle-orm";
import { cn, MAX_MEAL_DISPLAY_LIMIT } from "@/lib/utils";
import { Info, SearchX } from "lucide-react";
import { MealType } from "@/lib/types";

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
  const { page, query, mealType, maxCalories } = searchParams;
  const meals = await db.select({
    id: meal.id,
    title: meal.title,
    description: meal.description,
    type: meal.type,
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
      mealType ? eq(meal.type, mealType) : undefined,
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
      <div className="flex w-full items-center gap-2 text-sm">
        <Info size={16}/>
        You can click on a recipe&apos;s search icon to show more details.
      </div>
      <div className={cn(
        meals.length > 0
          ? "columns-xs *:break-inside-avoid space-y-3 sm:space-y-5"
          : "bg-sidebar border border-border w-full flex flex-col justify-center items-center gap-6 py-10 px-8 rounded-md"
      )}>
        {
          meals.length > 0 ? (
            <>{meals.map((m) => <MealResult key={m.id} meal={m}/>)}</> 
          ) : (
            <>
            <SearchX size={60}/>
            <div className="flex flex-col items-center gap-2">
              <h3 className="font-bold text-lg mt-auto">No Meal Found!</h3>
              <span className="font-semibold text-center text-muted-foreground">Try making another search or start creating one!</span>
            </div>
            </>
          )
        }
      </div>
    </div>
  );
}
