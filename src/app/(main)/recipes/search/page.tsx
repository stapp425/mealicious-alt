import SearchResults from "@/components/recipes/search/search-results";
import SearchBar from "@/components/recipes/search/search-bar";
import { db } from "@/db";
import { SearchParams } from "nuqs";
import { parseAsString, parseAsIndex, createLoader } from "nuqs/server";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { Suspense } from "react";
import { nanoid } from "nanoid";
import Pagination from "@/components/recipes/search/pagination";
import {
  recipe,
  recipeToDiet,
  diet as dietTable,
  recipeToDishType,
  dishType as dishTypeTable,
  cuisine as cuisineTable
} from "@/db/schema";
import { and, count, eq, exists, ilike } from "drizzle-orm";
import { MAX_GRID_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import SearchResultsSkeleton from "@/components/recipes/search/search-results-skeleton";

const loadSearchParams = createLoader({
  query: parseAsString.withDefault(""),
  cuisine: parseAsString.withDefault(""),
  diet: parseAsString.withDefault(""),
  dishType: parseAsString.withDefault(""),
  page: parseAsIndex.withDefault(0)
});

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Recipe Search | Mealicious",
  description: "Search for public mealicious recipes here!"
};

export default async function Page({ searchParams }: PageProps) {
  const { query, diet, dishType, cuisine, page } = await loadSearchParams(searchParams);

  const dietsQuery = db.query.diet.findMany({
    columns: {
      id: true,
      name: true
    }
  });

  const dishTypesQuery = db.query.dishType.findMany({
    columns: {
      id: true,
      name: true
    }
  });

  const cuisinesQuery = db.query.cuisine.findMany({
    columns: {
      id: true,
      adjective: true,
      icon: true
    }
  });

  const searchRecipesCountQuery = db.select({ count: count() })
    .from(recipe)
    .where(and(
      eq(recipe.isPublic, true),
      ilike(recipe.title, `%${query}%`),
      diet ? exists(
        db.select()
          .from(recipeToDiet)
          .innerJoin(dietTable, eq(recipeToDiet.dietId, dietTable.id))
          .where(and(
            eq(recipeToDiet.recipeId, recipe.id),
            eq(dietTable.name, diet),
          ))
      ) : undefined,
      dishType ? exists(
        db.select()
          .from(recipeToDishType)
          .innerJoin(dishTypeTable, eq(recipeToDishType.dishTypeId, dishTypeTable.id))
          .where(and(
            eq(recipeToDishType.recipeId, recipe.id),
            eq(dishTypeTable.name, dishType),
          ))
      ) : undefined,
      cuisine ? exists(
        db.select()
          .from(cuisineTable)
          .where(and(
            eq(cuisineTable.id, recipe.cuisineId),
            eq(cuisineTable.adjective, cuisine)
          ))
      ) : undefined
    ));

  const [diets, dishTypes, cuisines, [{ count: searchedRecipesCount }]] = await Promise.all([
    dietsQuery,
    dishTypesQuery,
    cuisinesQuery,
    searchRecipesCountQuery
  ]);
  
  return (
    <div className="flex-1 max-w-[750px] text-center sm:text-left w-full flex flex-col gap-4 p-4 mx-auto">
      <h1 className="font-bold text-4xl">Recipe Search</h1>
      <h2 className="font-semibold text-lg text-muted-foreground">Search mealicious recipes here!</h2>
      <SearchBar
        cuisines={cuisines}
        diets={diets}
        dishTypes={dishTypes}
      />
      <Separator />
      <Suspense key={nanoid()} fallback={<SearchResultsSkeleton />}>
        <SearchResults 
          count={searchedRecipesCount}
          searchParams={{ query, diet, dishType, cuisine, page }}
        />
      </Suspense>
      <Pagination totalPages={Math.ceil(searchedRecipesCount / MAX_GRID_RECIPE_DISPLAY_LIMIT)}/>
    </div>
  );
}
