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
import { createLoader, parseAsIndex, parseAsInteger, parseAsString } from "nuqs/server";
import SearchBar from "@/components/meals/saved/search-bar";
import { MAX_MEAL_DISPLAY_LIMIT } from "@/lib/utils";
import { getCachedData } from "@/lib/actions/redis";
import { CountSchema } from "@/lib/zod";

export const metadata: Metadata = {
  title: "All Meals | Mealicious",
  description: "View all your mealicious meals here!"
};

const loadSearchParams = createLoader({
  page: parseAsIndex.withDefault(0),
  query: parseAsString.withDefault(""),
  maxCalories: parseAsInteger.withDefault(0)
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ searchParams }: PageProps<"/meals">) {
  const { query, maxCalories, page } = await loadSearchParams(searchParams);
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  const userId = session.user.id;
  const mealCount = await getCachedData({
    cacheKey: `user_${userId}_meals_count${query ? `_query_${query}`: ""}${maxCalories > 0 ? `_max_calories_${maxCalories}` : ""}_page_${page}`,
    timeToLive: 60 * 3, // 3 minutes
    schema: CountSchema,
    call: () => db.select({ count: count() })
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
      ))
  });
  
  return (
    <div className="flex-1 max-w-250 w-full flex flex-col gap-3 mx-auto p-4">
      <h1 className="font-bold text-4xl">All Meals</h1>
      <SearchBar />
      <Suspense key={nanoid()} fallback={<SearchResultsSkeleton />}>
        <SearchResults 
          userId={userId}
          count={mealCount}
          query={query}
          maxCalories={maxCalories}
          page={page}
        />
      </Suspense>
      <Pagination totalPages={Math.ceil(mealCount / MAX_MEAL_DISPLAY_LIMIT)}/>
    </div>
  );
}
