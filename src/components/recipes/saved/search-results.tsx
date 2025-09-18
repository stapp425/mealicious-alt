import { Sort, Filter } from "@/lib/types";
import { SearchX } from "lucide-react";
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
import { eq, and, ilike, sql, asc, desc, SQL, exists } from "drizzle-orm";
import { RecipeResult, RecipeNotFound } from "@/components/recipes/saved/recipe-result";
import { MAX_LIST_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod/v4";
import { IdSchema, UrlSchema } from "@/lib/zod";
import { cache } from "react";

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

const SavedRecipesSchema = z.array(
  z.object({
    id: IdSchema,
    saveDate: z.date(),
    recipe: z.nullable(
      z.object({
        id: IdSchema,
        title: z.string().nonempty(),
        description: z.nullable(z.string().nonempty()),
        image: UrlSchema,
        calories: z.number().nonnegative(),
        prepTime: z.number().nonnegative(),
        diets: z.array(
          z.object({
            id: z.string().nonempty(),
            name: z.string().nonempty()
          })
        ),
        cuisine: z.nullable(
          z.object({
            id: IdSchema,
            adjective: z.string().nonempty(),
            icon: UrlSchema
          })
        ),
        sourceName: z.nullable(z.string().nonempty()),
        sourceUrl: z.nullable(UrlSchema),
        isFavorite: z.boolean(),
        isAuthor: z.boolean()
      })
    )
  })
);

export default async function SearchResults({ count, userId, searchParams }: SearchResultsProps) {
  const { query, sort, filters, page } = searchParams;

  const savedRecipes = await getSearchResults({
    query,
    userId,
    sort,
    filters,
    limit: MAX_LIST_RECIPE_DISPLAY_LIMIT,
    offset: page * MAX_LIST_RECIPE_DISPLAY_LIMIT
  });
  
  return (
    <div className="flex-1 flex flex-col gap-2.5">
      <h2 className="font-bold text-2xl">
        Search Results ({count})
      </h2>
      {
        savedRecipes.length > 0 ? (
          <div className="grid gap-3">
            {savedRecipes.map(({ id, saveDate, recipe }) => recipe ? (
              <RecipeResult
                key={id}
                saveDate={saveDate}
                recipe={recipe}
              />
            ) : (
              <RecipeNotFound 
                key={id}
                savedRecipeId={id}
              />
            ))}
          </div>
        ) : (
          <div className="w-full bg-sidebar border border-border rounded-md flex flex-col justify-center items-center gap-8 p-4 mx-auto">
            <SearchX size={60} className="stroke-muted-foreground"/>
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

const getSearchResults = cache(async ({
  query = "",
  userId,
  filters = [],
  sort = null,
  limit,
  offset
}: {
  query?: string;
  userId: string;
  filters?: Filter[];
  sort?: Sort | null;
  limit: number;
  offset: number;
}) => {
  const cuisineSubQuery = db.select({
    cuisine: sql`
      json_build_object(
        'id', ${cuisine.id}, 
        'adjective', ${cuisine.adjective}, 
        'icon', ${cuisine.icon}
      )
    `.as("cuisine")
  }).from(cuisine)
    .where(eq(cuisine.id, recipe.cuisineId))
    .as("cuisine_sub");

  const dietSubQuery = db.select({
    diets: sql`
      json_build_object(
        'id', ${diet.id},
        'name', ${diet.name}
      )
    `.as("diets")
  }).from(recipeToDiet)
    .where(eq(recipeToDiet.recipeId, recipe.id))
    .innerJoin(diet, eq(recipeToDiet.dietId, diet.id))
    .limit(MAX_DIET_DISPLAY_LIMIT)
    .as("diets_sub");

  const recipeToDietSubQuery = db.select({
    diets: sql`
      coalesce(
        json_agg("diets_sub"."diets"),
        '[]'::json
      )
    `.as("diets")
  }).from(dietSubQuery).as("recipe_to_diet_sub");

  const caloriesSubQuery = db.select({
    calories: recipeToNutrition.amount
  }).from(recipeToNutrition)
    .where(and(
      eq(recipeToNutrition.recipeId, recipe.id),
      eq(nutrition.name, "Calories")
    ))
    .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
    .as("recipe_to_nutrition_sub");

  const sortByTitle = asc(sql`"recipe_sub"."recipe"->>'title'`);
  const sortById = asc(sql`"recipe_sub"."recipe"->>'id'`);
  const sortByCalories = asc(sql`("recipe_sub"."recipe"->>'calories')::integer`);
  const sortByPrepTime = asc(sql`("recipe_sub"."recipe"->>'prepTime')::integer`);

  const orderByClauses: Record<Sort, SQL[]> = {
    title: [sortByTitle, sortById],
    calories: [sortByCalories, sortByTitle, sortById],
    prepTime: [sortByPrepTime, sortByTitle, sortById],
    saveDate: [desc(savedRecipe.saveDate), sortByTitle, sortById]
  };
  
  const filterClauses: Record<Filter, SQL> = {
    created: eq(sql`("recipe_sub"."recipe"->>'isAuthor')::boolean`, true),
    favorited: eq(sql`("recipe_sub"."recipe"->>'isFavorite')::boolean`, true)
  };

  const recipeSubQuery = db.select({
    recipe: sql`
      json_build_object(
        'id', ${recipe.id},
        'title', ${recipe.title},
        'description', ${recipe.description},
        'image', ${recipe.image},
        'calories', coalesce(${caloriesSubQuery.calories}::integer, 0),
        'prepTime', ${recipe.prepTime},
        'diets', ${recipeToDietSubQuery.diets},
        'cuisine', ${cuisineSubQuery.cuisine},
        'sourceName', ${recipe.sourceName},
        'sourceUrl', ${recipe.sourceUrl},
        'isFavorite', ${exists(
          db.select({ id: recipeFavorite.recipeId })
            .from(recipeFavorite)
            .where(and(
              eq(recipeFavorite.recipeId, recipe.id),
              eq(recipeFavorite.userId, userId)
            ))
        )},
        'isAuthor', ${eq(recipe.createdBy, userId)}
      )
    `.as("recipe")
  }).from(recipe)
    .where(and(
      eq(recipe.id, savedRecipe.recipeId),
      query ? ilike(recipe.title, `%${query}%`) : undefined
    ))
    .leftJoinLateral(cuisineSubQuery, sql`true`)
    .leftJoinLateral(recipeToDietSubQuery, sql`true`)
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .as("recipe_sub");

  const result = await db.select({
    id: savedRecipe.id,
    saveDate: savedRecipe.saveDate,
    recipe: recipeSubQuery.recipe
  }).from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, userId),
      ...filters.map((f) => filterClauses[f])
    ))
    .leftJoinLateral(recipeSubQuery, sql`true`)
    .limit(limit)
    .offset(offset)
    .orderBy(...(sort ? [...orderByClauses[sort]] : [sortById]));

  return SavedRecipesSchema.max(limit).parse(result);
});

export function SearchResultsSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-3">
      <Skeleton className="w-56 h-9 rounded-sm"/>
      <Skeleton className="w-82 h-6 rounded-sm"/>
      {
        Array.from({ length: MAX_LIST_RECIPE_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
          <Skeleton key={i} className="w-full h-125 @min-2xl:h-44 rounded-md"/>
        ))
      }
    </div>
  );
}
