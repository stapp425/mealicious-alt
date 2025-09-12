import CreatedRecipesResult from "@/components/user/recipes/created-recipes-result";
import Pagination from "@/components/user/recipes/pagination";
import { db } from "@/db";
import { diet, nutrition, recipe, recipeToDiet, recipeToNutrition } from "@/db/schema";
import { MAX_USER_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import { CountSchema } from "@/lib/zod";
import { sql, and, eq, count, desc } from "drizzle-orm";
import { SearchX } from "lucide-react";
import { createLoader, parseAsIndex } from "nuqs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_DIET_DISPLAY_LIMIT = 3;

const loadSearchParams = createLoader({
  page: parseAsIndex.withDefault(0)
});

export default async function Page({ params, searchParams }: PageProps<"/user/[user_id]/recipes/created">) {
  const { user_id: userId } = await params;
  const { page } = await loadSearchParams(searchParams);
  
  const caloriesSubQuery = db.select({
    recipeId: recipeToNutrition.recipeId,
    calories: sql`coalesce(${recipeToNutrition.amount}, 0)`.as("calories")
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
  
  const createdRecipesQuery = db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    prepTime: sql`${recipe.prepTime}`.mapWith(Number),
    calories: sql`coalesce(${caloriesSubQuery.calories}, 0)`.mapWith(Number),
    diets: sql<{
      id: string;
      name: string;
    }[]>`coalesce(${recipeToDietSubQuery.diets}, '[]'::json)`,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  }).from(recipe)
    .where(and(eq(recipe.createdBy, userId), eq(recipe.isPublic, true)))
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .leftJoinLateral(recipeToDietSubQuery, sql`true`)
    .orderBy(desc(recipe.createdAt))
    .limit(MAX_USER_RECIPE_DISPLAY_LIMIT)
    .offset(page * MAX_USER_RECIPE_DISPLAY_LIMIT);

  const createdRecipesCountQuery = db.select({ count: count() })
    .from(recipe)
    .where(and(eq(recipe.createdBy, userId), eq(recipe.isPublic, true)));

  const [createdRecipesCount, createdRecipes] = await Promise.all([
    createdRecipesCountQuery.then((val) => CountSchema.parse(val)),
    createdRecipesQuery
  ]);

  if (createdRecipes.length === 0) {
    return (
      <section className="flex flex-col justify-center gap-2">
        <h1 className="font-bold text-xl">Created Recipes ({createdRecipesCount})</h1>
        <div className="border border-border bg-sidebar min-h-72 flex flex-col justify-center items-center gap-4 py-12 rounded-md">
          <SearchX size={48} className="stroke-muted-foreground"/>
          <h3 className="font-bold text-lg">No created recipes yet...</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col gap-3">
      <h1 className="font-bold text-xl">Created Recipes ({createdRecipesCount})</h1>
      <div className="flex-1 grid @min-lg:grid-cols-2 @min-4xl:grid-cols-3 content-start gap-4">
        {
          createdRecipes.map((r) => (
            <CreatedRecipesResult 
              key={r.id}
              recipe={r}
            />
          ))
        }
      </div>
      <Pagination totalPages={Math.ceil(createdRecipesCount / MAX_USER_RECIPE_DISPLAY_LIMIT)}/>
    </section>
  );
}
