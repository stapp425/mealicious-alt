import { db } from "@/db";
import { Skeleton } from "@/components/ui/skeleton";
import { meal, mealToRecipe, nutrition, recipe, recipeToNutrition } from "@/db/schema";
import { and, eq, ilike, lte, sql, sum } from "drizzle-orm";
import { MAX_MEAL_DISPLAY_LIMIT } from "@/lib/utils";
import { SearchX } from "lucide-react";
import MealResult from "@/components/meals/saved/meal-result";
import z from "zod/v4";
import { IdSchema, UrlSchema } from "@/lib/zod";
import { cache } from "react";

type SearchResultsProps = {
  count: number;
  userId: string;
  page: number;
  query: string;
  maxCalories: number;
};

const MealResultsSchema = z.array(
  z.object({
    id: IdSchema,
    title: z.string().nonempty(),
    description: z.nullable(z.string().nonempty()),
    tags: z.array(z.string().nonempty()),
    calories: z.coerce.number()
      .nonnegative()
      .transform(Math.round),
    recipes: z.array(
      z.object({
        id: IdSchema,
        title: z.string().nonempty(),
        image: UrlSchema,
        description: z.nullable(z.string().nonempty())
      })
    )
  })
);

export default async function SearchResults({
  count,
  userId,
  page,
  query,
  maxCalories
}: SearchResultsProps) {
  const meals = await getMealResults({
    query,
    userId,
    maxCalories,
    limit: MAX_MEAL_DISPLAY_LIMIT,
    offset: page * MAX_MEAL_DISPLAY_LIMIT
  });
  
  return (
    <div className="flex-1 flex flex-col gap-3">
      <h2 className="font-bold text-2xl">
        Search Results ({count})
      </h2>
      {
        meals.length > 0 ? (
          <div className="columns-1 @min-3xl:columns-2 *:break-inside-avoid space-y-3 @min-2xl:space-y-5">
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
      <div className="w-full grid @min-3xl:grid-cols-2 gap-3">
        {
          Array.from({ length: MAX_MEAL_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
            <Skeleton key={i} className="h-124 rounded-md"/>
          ))
        }
      </div>
    </div>
  );
}

const getMealResults = cache(async ({
  query = "",
  userId,
  maxCalories = 0,
  limit,
  offset
}: {
  query?: string;
  userId: string;
  maxCalories?: number;
  limit: number;
  offset: number;
}) => {
  const recipeToNutritionSubQuery = db.select({
    calories: recipeToNutrition.amount
  }).from(recipeToNutrition)
    .where(and(
      eq(recipeToNutrition.recipeId, recipe.id),
      eq(nutrition.name, "Calories")
    ))
    .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
    .as("recipe_to_nutrition_sub");

  const recipeSubQuery = db.select({
    calories: recipeToNutritionSubQuery.calories,
    recipe: sql`
      json_build_object(
        'id', ${recipe.id},
        'title', ${recipe.title},
        'image', ${recipe.image},
        'description', ${recipe.description}
      )
    `.as("recipe")
  }).from(recipe)
    .where(eq(mealToRecipe.recipeId, recipe.id))
    .innerJoinLateral(recipeToNutritionSubQuery, sql`true`)
    .as("recipe_sub");

  const mealToRecipeSubQuery = db.select({
    totalCalories: sum(recipeSubQuery.calories).mapWith(Number).as("total_calories"),
    recipes: sql`
      coalesce(
        json_agg(${recipeSubQuery.recipe}),
        '[]'::json
      )
    `.as("recipes")
  }).from(mealToRecipe)
  .where(eq(mealToRecipe.mealId, meal.id))
  .leftJoinLateral(recipeSubQuery, sql`true`)
  .as("meal_to_recipe_sub");

  const result = await db.select({
    id: meal.id,
    title: meal.title,
    description: meal.description,
    tags: meal.tags,
    calories: mealToRecipeSubQuery.totalCalories,
    recipes: mealToRecipeSubQuery.recipes,
  }).from(meal)
    .where(and(
      eq(meal.createdBy, userId),
      query ? ilike(meal.title, `%${query}%`) : undefined,
      maxCalories > 0 ? lte(mealToRecipeSubQuery.totalCalories, maxCalories) : undefined
    ))
    .innerJoinLateral(mealToRecipeSubQuery, sql`true`)
    .limit(limit)
    .offset(offset);

  return MealResultsSchema.parse(result);
});
