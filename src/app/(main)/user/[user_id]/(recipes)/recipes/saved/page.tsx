import Pagination from "@/components/user/recipes/pagination";
import SavedRecipesResult from "@/components/user/recipes/saved-recipes-result";
import { db } from "@/db";
import { diet, nutrition, recipe, recipeToDiet, recipeToNutrition, savedRecipe, user } from "@/db/schema";
import { MAX_USER_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import { CountSchema } from "@/lib/zod";
import { sql, and, eq, exists, count, not } from "drizzle-orm";
import { SearchX } from "lucide-react";
import { createLoader, parseAsIndex } from "nuqs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_DIET_DISPLAY_LIMIT = 3;

const loadSearchParams = createLoader({
  page: parseAsIndex.withDefault(0)
});

export default async function Page({ params, searchParams }: PageProps<"/user/[user_id]/recipes/saved">) {
  const { user_id: userId } = await params;
  const { page } = await loadSearchParams(searchParams);

  const caloriesSubQuery = db.select({
    recipeId: recipeToNutrition.recipeId,
    calories: sql`coalesce(${recipeToNutrition.amount}, 0)`.mapWith((val) => Number(val)).as("calories")
  }).from(recipeToNutrition)
    .where(and(
      eq(nutrition.name, "Calories"),
      eq(recipeToNutrition.recipeId, recipe.id)
    ))
    .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
    .as("recipe_to_nutrition_sub");

  const dietSubQuery = db.select({
    recipeId: recipeToDiet.recipeId,
    diet: sql`
      json_build_object(
        'id', ${diet.id},
        'name', ${diet.name}
      )
    `.as("diet")
  }).from(recipeToDiet)
    .where(eq(recipeToDiet.recipeId, recipe.id))
    .innerJoin(diet, eq(recipeToDiet.dietId, diet.id))
    .limit(MAX_DIET_DISPLAY_LIMIT)
    .as("diet_sub");

  const recipeToDietSubQuery = db.select({
    recipeId: dietSubQuery.recipeId,
    diets: sql`json_agg(${dietSubQuery.diet})`.as("diets")
  }).from(dietSubQuery)
    .where(eq(dietSubQuery.recipeId, recipe.id))
    .groupBy(dietSubQuery.recipeId)
    .as("recipe_to_diet_sub");

  const userSubQuery = db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image
  }).from(user)
    .where(eq(user.id, recipe.createdBy))
    .as("user_sub");

  const savedRecipesCountQuery = db.select({ count: count() })
    .from(recipe)
    .where(and(
      not(eq(recipe.createdBy, userId)),
      eq(recipe.isPublic, true),
      exists(
        db.select()
          .from(savedRecipe)
          .where(and(
            eq(savedRecipe.recipeId, recipe.id),
            eq(savedRecipe.userId, userId)
          ))
      )
    ));

  const savedRecipesQuery = db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    prepTime: sql`${recipe.prepTime}`.mapWith((val) => Number(val)),
    calories: sql`coalesce(${caloriesSubQuery.calories}, 0)`.mapWith((val) => Number(val)),
    diets: sql<{
      id: string;
      name: string;
    }[]>`coalesce(${recipeToDietSubQuery.diets}, '[]'::json)`,
    creator: {
      id: userSubQuery.id,
      name: userSubQuery.name,
      email: userSubQuery.email,
      image: userSubQuery.image
    }
  }).from(recipe)
    .where(and(
      not(eq(recipe.createdBy, userId)),
      eq(recipe.isPublic, true),
      exists(
        db.select()
          .from(savedRecipe)
          .where(and(
            eq(savedRecipe.recipeId, recipe.id),
            eq(savedRecipe.userId, userId)
          ))
      )
    ))
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .leftJoinLateral(recipeToDietSubQuery, sql`true`)
    .leftJoinLateral(userSubQuery, sql`true`)
    .limit(MAX_USER_RECIPE_DISPLAY_LIMIT)
    .offset(page * MAX_USER_RECIPE_DISPLAY_LIMIT);

  const [savedRecipesCount, savedRecipes] = await Promise.all([
    savedRecipesCountQuery.then((val) => CountSchema.parse(val)),
    savedRecipesQuery
  ]);

  if (savedRecipes.length === 0) {
    return (
      <section className="flex flex-col justify-center gap-2">
        <h1 className="font-bold text-xl">Saved Recipes ({savedRecipesCount})</h1>
        <div className="border border-border bg-sidebar min-h-72 flex flex-col justify-center items-center gap-4 py-12 rounded-md">
          <SearchX size={48} className="stroke-muted-foreground"/>
          <h3 className="font-bold text-lg">No saved recipes yet...</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col gap-3">
      <h1 className="font-bold text-xl">Saved Recipes ({savedRecipesCount})</h1>
      <div className="flex-1 grid @min-lg:grid-cols-2 @min-4xl:grid-cols-3 content-start gap-4">
        {
          savedRecipes.map((r) => (
            <SavedRecipesResult 
              key={r.id}
              recipe={r}
            />
          ))
        }
      </div>
      <Pagination totalPages={Math.ceil(savedRecipesCount / MAX_USER_RECIPE_DISPLAY_LIMIT)}/>
    </section>
  );
}
