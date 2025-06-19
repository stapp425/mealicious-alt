import { Sort, Filter } from "@/lib/types";
import { Info, SearchX } from "lucide-react";
import { db } from "@/db";
import {
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
import { MAX_LIST_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";

type SearchResultsProps = {
  query: string;
  sort: Sort | null;
  filters: Filter[];
  page: number;
};

const MAX_DIET_DISPLAY_LIMIT = 4;

export default async function SearchResults({ query, sort, filters, page }: SearchResultsProps) {
  const session = await auth();

  if (!session?.user)
    redirect("/login");

  const { user } = session;
  
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
    }[]>`"recipe_to_diet_sub"."data"`.as("diets"),
    cuisine: sql<{
      id: string;
      adjective: string;
      icon: string;
    } | null>`"cuisine_sub"."data"`,
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
    saveDate: savedRecipe.saveDate,
    isFavorite: sql<boolean>`CASE WHEN "favorite_sub"."data" IS NOT NULL THEN TRUE ELSE FALSE END`.as("is_favorite"),
    isAuthor: sql<boolean>`CASE WHEN ${recipe.createdBy} = ${user.id!} THEN TRUE ELSE FALSE END`.as("is_author")
  }).from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, user.id!),
      query ? ilike(recipe.title, `%${query}%`) : undefined,
      ...filters.map((f) => filterClauses[f])
    ))
    .innerJoin(recipe, eq(savedRecipe.recipeId, recipe.id))
    .leftJoinLateral(
      db.select({
        data: sql`
          json_build_object(
            'id', ${cuisine.id}, 
            'adjective', ${cuisine.adjective}, 
            'icon', ${cuisine.icon}
          )
        `.as("data")
      }).from(cuisine)
        .where(eq(cuisine.id, recipe.cuisineId))
        .as("cuisine_sub"),
      sql`true`
    )
    .leftJoinLateral(
      db.select({
        diets: sql`
          coalesce(
            json_agg("diets_sub"."data"),
            '[]'::json
          )
        `.as("data")
      }).from(recipeToDiet)
        .where(eq(recipe.id, recipeToDiet.recipeId))
        .innerJoinLateral(
          db.select({
            diet: sql`
              json_build_object(
                'id', ${diet.id},
                'name', ${diet.name}
              )
            `.as("data")
          }).from(diet)
            .where(eq(recipeToDiet.dietId, diet.id))
            .limit(MAX_DIET_DISPLAY_LIMIT)
            .as("diets_sub"),
          sql`true`
        )
        .as("recipe_to_diet_sub"),
      sql`true`
    )
    .leftJoinLateral(
      db.select({
        data: sql`
          json_build_object(
            'user_id', ${recipeFavorite.userId},
            'recipe_id', ${recipeFavorite.recipeId}
          )
        `.as("data")
      }).from(recipeFavorite)
        .where(and(
          eq(savedRecipe.userId, recipeFavorite.userId),
          eq(savedRecipe.recipeId, recipeFavorite.recipeId)
        ))
        .as("favorite_sub"),
      sql`true`
    )
    .limit(MAX_LIST_RECIPE_DISPLAY_LIMIT)
    .offset(page * MAX_LIST_RECIPE_DISPLAY_LIMIT)
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
  const totalPages = Math.ceil(savedRecipesCount / MAX_LIST_RECIPE_DISPLAY_LIMIT);
  
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
          <div className="flex flex-col gap-3">
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
