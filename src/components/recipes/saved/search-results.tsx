import { Sort, Filter } from "@/lib/types";
import { Info, SearchX } from "lucide-react";
import { db } from "@/db";
import {
  cuisine, 
  diet, 
  nutrition, 
  recipe, 
  recipeFavorite, 
  recipeToDiet, 
  recipeToNutrition, 
  savedRecipe
} from "@/db/schema";
import { eq, and, ilike, sql, asc, desc, SQL, isNotNull } from "drizzle-orm";
import RecipeResult from "@/components/recipes/saved/recipe-result";
import { MAX_LIST_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";

type SearchResultsProps = {
  count: number;
  userId: string;
  searchParams: {
    query: string;
    sort: Sort | null;
    filters: Filter[];
    page: number;
  };
};

const MAX_DIET_DISPLAY_LIMIT = 3;

export default async function SearchResults({ count, userId, searchParams }: SearchResultsProps) {
  const { query, sort, filters, page } = searchParams;
  
  const orderByClauses: Record<Sort, SQL> = {
    title: asc(recipe.title),
    calories: asc(sql`"recipe_to_nutrition_sub"."calories"`),
    prepTime: asc(recipe.prepTime),
    saveDate: desc(savedRecipe.saveDate)
  };
  
  const filterClauses: Record<Filter, SQL> = {
    created: eq(recipe.createdBy, userId),
    favorited: isNotNull(sql`"favorite_sub"."is_favorite"`)
  };

  const savedRecipes = await db.select({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    image: recipe.image,
    calories: sql<number>`"recipe_to_nutrition_sub"."calories"`.as("calories"),
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
    isFavorite: sql<boolean>`"favorite_sub"."is_favorite"`.as("is_favorite"),
    isAuthor: sql<boolean>`CASE WHEN ${recipe.createdBy} = ${userId} THEN TRUE ELSE FALSE END`.as("is_author")
  }).from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, userId),
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
      }).from(
        db.select({
          data: sql`
            json_build_object(
              'id', ${diet.id},
              'name', ${diet.name}
            )
          `.as("data")
        }).from(recipeToDiet)
          .where(eq(recipeToDiet.recipeId, recipe.id))
          .innerJoin(diet, eq(recipeToDiet.dietId, diet.id))
          .limit(MAX_DIET_DISPLAY_LIMIT)
          .as("diets_sub")
      ).as("recipe_to_diet_sub"),
      sql`true`
    )
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
    .leftJoinLateral(
      db.select({
        isFavorite: sql`
          CASE WHEN ${recipeFavorite.userId} IS NOT NULL AND ${recipeFavorite.recipeId} IS NOT NULL THEN TRUE ELSE FALSE END
        `.as("is_favorite")
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
  
  return (
    <div className="flex-1 flex flex-col gap-3">
      <h2 className="font-bold text-2xl">
        Search Results ({count})
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
    </div>
  );
}
