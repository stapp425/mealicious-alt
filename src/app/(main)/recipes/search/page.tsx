import SearchResults from "@/components/recipes/search/search-results";
import SearchBar from "@/components/recipes/search/search-bar";
import { db } from "@/db";
import { createLoader, parseAsString, parseAsBoolean } from "nuqs/server";
import { Metadata } from "next";
import {
  userToCuisine,
  userToDiet,
  userToDishType
} from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const loadSearchParams = createLoader({
  query: parseAsString.withDefault(""),
  cuisine: parseAsString.withDefault(""),
  diet: parseAsString.withDefault(""),
  dishType: parseAsString.withDefault(""),
  isUsingCuisinePreferences: parseAsBoolean.withDefault(false),
  isUsingDietPreferences: parseAsBoolean.withDefault(false),
  isUsingDishTypePreferences: parseAsBoolean.withDefault(false)
});

export const metadata: Metadata = {
  title: "Recipe Search | Mealicious",
  description: "Search for public mealicious recipes here!"
};

export default async function Page({ searchParams }: PageProps<"/recipes/search">) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/login");

  const loadedSearchParams = await loadSearchParams(searchParams);
  const dietsQuery = db.query.diet.findMany({
    columns: {
      id: true,
      name: true
    },
    orderBy: (diet, { asc }) => [asc(diet.name)]
  });

  const dishTypesQuery = db.query.dishType.findMany({
    columns: {
      id: true,
      name: true
    },
    orderBy: (dishType, { asc }) => [asc(dishType.name)]
  });

  const cuisinesQuery = db.query.cuisine.findMany({
    columns: {
      id: true,
      adjective: true,
      icon: true
    },
    orderBy: (cuisine, { asc }) => [asc(cuisine.adjective)]
  });
  
  const cuisinePreferencesCountQuery = db.select({ count: count() })
    .from(userToCuisine)
    .where(eq(userToCuisine.userId, userId));

  const dietPreferencesCountQuery = db.select({ count: count() })
    .from(userToDiet)
    .where(eq(userToDiet.userId, userId));
  
  const dishTypePreferencesCountQuery = db.select({ count: count() })
    .from(userToDishType)
    .where(eq(userToDishType.userId, userId));

  const [
    diets,
    dishTypes,
    cuisines,
    [{ count: cuisinePreferencesCount }],
    [{ count: dietPreferencesCount }],
    [{ count: dishTypePreferencesCount }]
  ] = await Promise.all([
    dietsQuery,
    dishTypesQuery,
    cuisinesQuery,
    cuisinePreferencesCountQuery,
    dietPreferencesCountQuery,
    dishTypePreferencesCountQuery
  ]);
  
  return (
    <div className="flex-1 max-w-286 text-center @min-2xl:text-left w-full flex flex-col gap-2 p-4 mx-auto">
      <div className="flex flex-col gap-0.5 mb-1">
        <h1 className="font-bold text-4xl">Recipe Search</h1>
        <h2 className="font-semibold text-muted-foreground">Search mealicious recipes here!</h2>
      </div>
      <SearchBar
        cuisines={cuisines}
        diets={diets}
        dishTypes={dishTypes}
        hasCuisinePreferences={cuisinePreferencesCount > 0}
        hasDietPreferences={dietPreferencesCount > 0}
        hasDishTypePreferences={dishTypePreferencesCount > 0}
      />
      <SearchResults 
        userId={userId}
        {...loadedSearchParams}
      />
    </div>
  );
}
