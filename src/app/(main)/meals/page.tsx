import { auth } from "@/auth";
import { db } from "@/db";
import { meal, mealToRecipe, nutrition, recipe, recipeToNutrition } from "@/db/schema";
import { redirect } from "next/navigation";
import { and, count, eq, ilike, lte, sql } from "drizzle-orm";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/meals/saved/pagination";
import { Metadata } from "next";
import { Suspense } from "react";
import { nanoid } from "nanoid";
import SearchResults from "@/components/meals/saved/search-results";
import { createLoader, parseAsIndex, parseAsInteger, parseAsString, parseAsStringLiteral, SearchParams } from "nuqs/server";
import { mealTypes } from "@/lib/types";
import SearchBar from "@/components/meals/saved/search-bar";
import SearchResultsSkeleton from "@/components/meals/saved/search-results-skeleton";
import { MAX_MEAL_DISPLAY_LIMIT } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Meals | Mealicious",
  description: "View all your mealicious meals here!"
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
  page: parseAsIndex.withDefault(0),
  query: parseAsString.withDefault(""),
  mealType: parseAsStringLiteral(mealTypes),
  maxCalories: parseAsInteger.withDefault(0)
});

export default async function Page({ searchParams }: PageProps) {
  const loadedSearchParams = await loadSearchParams(searchParams);
  const session = await auth();
  
  if (!session?.user?.id)
    redirect("/login");
  
  const userId = session?.user?.id;
  const [{ count: mealCount }] = await db.select({ count: count() })
    .from(meal)
    .where(and(
      eq(meal.createdBy, userId),
      loadedSearchParams.query ? ilike(meal.title, `%${loadedSearchParams.query}%`) : undefined,
      loadedSearchParams.maxCalories > 0 ? lte(
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
        loadedSearchParams.maxCalories
      ) : undefined
    ));
  
  return (
    <div className="flex-1 max-w-[1000px] w-full flex flex-col gap-3 mx-auto p-4">
      <h1 className="font-bold text-4xl">All Meals</h1>
      <SearchBar />
      <Separator />
      <Suspense key={nanoid()} fallback={<SearchResultsSkeleton />}>
        <SearchResults 
          userId={userId}
          count={mealCount}
          searchParams={loadedSearchParams}
        />
      </Suspense>
      <Pagination totalPages={Math.ceil(mealCount / MAX_MEAL_DISPLAY_LIMIT)}/>
    </div>
  );
}
