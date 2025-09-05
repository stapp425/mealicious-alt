import { auth } from "@/auth";
import { db } from "@/db";
import { meal, mealToRecipe, nutrition, recipe, recipeToNutrition } from "@/db/schema";
import { redirect } from "next/navigation";
import { and, count, eq, ilike, lte, sql } from "drizzle-orm";
import Pagination from "@/components/meals/saved/pagination";
import { Metadata } from "next";
import { Suspense } from "react";
import { nanoid } from "nanoid";
import SearchResults, { SearchResultsSkeleton } from "@/components/meals/saved/search-results";
import { createLoader, parseAsIndex, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { mealTypes } from "@/lib/types";
import SearchBar from "@/components/meals/saved/search-bar";
import { MAX_MEAL_DISPLAY_LIMIT } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Meals | Mealicious",
  description: "View all your mealicious meals here!"
};

const loadSearchParams = createLoader({
  page: parseAsIndex.withDefault(0),
  query: parseAsString.withDefault(""),
  mealType: parseAsStringLiteral(mealTypes),
  maxCalories: parseAsInteger.withDefault(0)
});

export default async function Page({ searchParams }: PageProps<"/meals">) {
  const { query, maxCalories, mealType, page } = await loadSearchParams(searchParams);
  const session = await auth();
  
  if (!session?.user?.id) redirect("/login");
  
  const userId = session?.user?.id;
  const [{ count: mealCount }] = await db.select({ count: count() })
    .from(meal)
    .where(and(
      eq(meal.createdBy, userId),
      query ? ilike(meal.title, `%${query}%`) : undefined,
      maxCalories > 0 ? lte(
        db.select({
          sum: sql`sum("recipe_sub"."calories")`.as("total_calories")
        }).from(mealToRecipe)
          .where(eq(mealToRecipe.mealId, meal.id))
          .innerJoinLateral(
            db.select({
              calories: sql`"recipe_to_nutrition_sub"."calories"`.as("calories")
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
          ),
        maxCalories
      ) : undefined
    ));
  
  return (
    <div className="flex-1 max-w-250 w-full grid gap-3 mx-auto p-4">
      <h1 className="font-bold text-4xl">All Meals</h1>
      <SearchBar />
      <Suspense key={nanoid()} fallback={<SearchResultsSkeleton />}>
        <SearchResults 
          userId={userId}
          count={mealCount}
          searchParams={{ query, maxCalories, mealType, page }}
        />
      </Suspense>
      <Pagination totalPages={Math.ceil(mealCount / MAX_MEAL_DISPLAY_LIMIT)}/>
    </div>
  );
}
