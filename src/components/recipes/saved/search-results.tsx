import { Sort, View, Filter } from "@/lib/types";
import { Info, SearchX } from "lucide-react";
import { db } from "@/db";
import { 
  country, 
  countryToCuisine, 
  cuisine, 
  diet, 
  recipe, 
  recipeFavorite, 
  recipeToDiet, 
  savedRecipe
} from "@/db/schema";
import { eq, and, ilike, sql, asc, desc, count, SQL } from "drizzle-orm";
import Pagination from "@/components/recipes/saved/pagination";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RecipeResult from "@/components/recipes/saved/recipe-result";
import { 
  cn,
  MAX_GRID_RECIPE_DISPLAY_LIMIT, 
  MAX_LIST_RECIPE_DISPLAY_LIMIT 
} from "@/lib/utils";

type SearchResultsProps = {
  query: string;
  sort: Sort | null;
  filters: Filter[];
  view: View;
  page: number;
};

export default async function SearchResults({ query, sort, filters, view, page }: SearchResultsProps) {
  const session = await auth();

  if (!session?.user)
    redirect("/login");

  const { user } = session;
  const recipeDisplayLimit = view === "list" ? MAX_LIST_RECIPE_DISPLAY_LIMIT : MAX_GRID_RECIPE_DISPLAY_LIMIT;
  
  const orderByClauses: Record<Sort, SQL> = {
    title: asc(recipe.title),
    prepTime: asc(recipe.prepTime),
    saveDate: desc(savedRecipe.saveDate)
  };
  
  const filterClauses: Record<Filter, SQL> = {
    created: eq(sql<boolean>`CASE WHEN ${recipe.createdBy} = ${user.id!} THEN TRUE ELSE FALSE END`, true),
    favorited: eq(sql<boolean>`CASE WHEN ${recipeFavorite.recipeId} IS NOT NULL THEN TRUE ELSE FALSE END`, true)
  };

  const savedRecipesQuery = db.select({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    image: recipe.image,
    prepTime: recipe.prepTime,
    diets: sql<{
      id: string;
      name: string;
    }[] | null>`
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', ${diet.id},
          'name', ${diet.name}
        )
      ) FILTER (WHERE ${diet.id} IS NOT NULL)
    `.as("diets"),
    cuisine: sql<{
      adjective: string;
      countries: {
        id: string;
        icon: string;
      }[];
    } | null>`
      JSON_BUILD_OBJECT(
        'adjective', ${cuisine.adjective},
        'countries', JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', ${country.id},
            'icon', ${country.icon}
          )
        )
      )
    `.as("cuisine"),
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
    saveDate: savedRecipe.saveDate,
    isFavorite: sql<boolean>`CASE WHEN ${recipeFavorite.recipeId} IS NOT NULL THEN TRUE ELSE FALSE END`.as("is_favorite"),
    isAuthor: sql<boolean>`CASE WHEN ${recipe.createdBy} = ${user.id!} THEN TRUE ELSE FALSE END`.as("is_author")
  }).from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, user.id!),
      ilike(recipe.title, `%${query}%`),
      ...filters.map((f) => filterClauses[f])
    ))
    .innerJoin(recipe, eq(savedRecipe.recipeId, recipe.id))
    .leftJoin(cuisine, eq(recipe.cuisineId, cuisine.id))
    .leftJoin(countryToCuisine, eq(cuisine.id, countryToCuisine.cuisineId))
    .leftJoin(country, eq(countryToCuisine.countryId, country.id))
    .leftJoin(recipeToDiet, eq(recipe.id, recipeToDiet.recipeId))
    .leftJoin(diet, eq(recipeToDiet.dietId, diet.id))
    .leftJoin(recipeFavorite, and(
      eq(savedRecipe.userId, recipeFavorite.userId),
      eq(savedRecipe.recipeId, recipeFavorite.recipeId)
    ))
    .limit(recipeDisplayLimit)
    .offset(page * recipeDisplayLimit)
    .groupBy(recipe.id, savedRecipe.saveDate, cuisine.id, recipeFavorite.recipeId)
    .orderBy(...(sort ? [orderByClauses[sort]] : []));

  const savedRecipesCountQuery = db.select({ count: count() })
    .from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, user.id!),
      ilike(recipe.title, `%${query}%`),
      ...filters.map((f) => filterClauses[f])
    ))
    .innerJoin(recipe, eq(savedRecipe.recipeId, recipe.id))
    .leftJoin(recipeFavorite, and(
      eq(savedRecipe.userId, recipeFavorite.userId),
      eq(savedRecipe.recipeId, recipeFavorite.recipeId)
    ));
  
  const [savedRecipes, [{ count: savedRecipesCount }]] = await Promise.all([savedRecipesQuery, savedRecipesCountQuery]);
  const totalPages = Math.ceil(savedRecipesCount / recipeDisplayLimit);
  
  return (
    <div className="flex-1 flex flex-col gap-3">
      <h2 className="font-bold text-2xl">
        Search Results ({savedRecipesCount})
      </h2>
      {
        savedRecipes.length > 0 ? (
          <>
          <div className="flex w-full items-center gap-2 text-sm">
            <Info size={16}/>
            You can click on a recipe to show more details.
          </div>
          <div className={cn({
            "flex flex-col gap-3": view === "list",
            "grid grid-cols-2 gap-3": view === "grid"
          })}>
            {savedRecipes.map((r) => <RecipeResult key={r.id} recipe={r}/>)}
          </div>
          </>
        ) : (
          <div className="w-full bg-sidebar border border-border rounded-md flex flex-col justify-center items-center gap-8 p-4 mx-auto">
            <SearchX size={60}/>
            <div className="flex flex-col items-center gap-2">
              <h3 className="font-bold text-lg mt-auto">No Recipe Found!</h3>
              <span className="font-semibold text-center text-muted-foreground">Try making another search or start creating one!</span>
            </div>
          </div>
        )
      }
      <Pagination pages={totalPages}/>
    </div>
  );
}
