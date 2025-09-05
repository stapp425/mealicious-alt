import { db } from "@/db";
import { diet, nutrition, recipe, recipeToDiet, recipeToNutrition } from "@/db/schema";
import { getCachedData } from "@/lib/actions/redis";
import { sql, and, eq, desc, count } from "drizzle-orm";
import Pagination from "@/components/user/recipes/pagination";
import { SearchX } from "lucide-react";
import CreatedRecipesResult from "@/components/user/recipes/created-recipes-result";
import { CountSchema } from "@/lib/zod";

type CreatedRecipesProps = {
  userId: string;
  limit: number;
};

const MAX_DIET_DISPLAY_LIMIT = 3;

export default async function CreatedRecipes({ userId, limit }: CreatedRecipesProps) {
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
  
  const createdRecipesCountQuery = db.select({ count: count() })
    .from(recipe)
    .where(and(eq(recipe.createdBy, userId), eq(recipe.isPublic, true)));
  
  const createdRecipesQuery = db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    prepTime: sql`${recipe.prepTime}`.mapWith((val) => Number(val)),
    calories: sql`coalesce(${caloriesSubQuery.calories}, 0)`.mapWith((val) => Number(val)),
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
    .limit(limit);

  const [createdRecipesCount, createdRecipes] = await Promise.all([
    getCachedData({
      cacheKey: `created_recipes_user_${userId}`,
      timeToLive: 120,
      call: () => createdRecipesCountQuery,
      schema: CountSchema
    }),
    createdRecipesQuery
  ]);

  if (createdRecipes.length === 0) {
    return (
      <section className="flex flex-col justify-center gap-2">
        <h1 className="font-bold text-xl">Created Recipes ({createdRecipesCount})</h1>
        <div className="border border-border bg-sidebar min-h-[250px] flex flex-col justify-center items-center gap-4 py-12 rounded-md">
          <SearchX size={48} className="stroke-muted-foreground"/>
          <h3 className="font-bold text-lg">No created recipes yet...</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col gap-3">
      <h1 className="font-bold text-xl">Created Recipes ({createdRecipesCount})</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {
          createdRecipes.map((r) => (
            <CreatedRecipesResult 
              key={r.id}
              recipe={r}
            />
          ))
        }
      </div>
      <Pagination totalPages={Math.ceil(createdRecipesCount / limit)}/>
    </section>
  );
}
