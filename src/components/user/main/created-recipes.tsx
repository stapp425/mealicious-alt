import { db } from "@/db";
import { diet, nutrition, recipe, recipeToDiet, recipeToNutrition } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import UserInfoCarousel from "@/components/user/main/user-info-carousel";
import CreatedRecipesResult from "@/components/user/main/created-recipes-result";
import { Route } from "next";

type CreatedRecipesProps = {
  userId: string;
  limit: number;
};

const MAX_DIET_DISPLAY_LIMIT = 3;

export default async function CreatedRecipes({ userId, limit }: CreatedRecipesProps) {
  const caloriesSubQuery = db.select({
    recipeId: recipeToNutrition.recipeId,
    calories: recipeToNutrition.amount
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
  
  const createdRecipes = await db.select({
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
    .where(and(
      eq(recipe.createdBy, userId),
      eq(recipe.isPublic, true)
    ))
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .leftJoinLateral(recipeToDietSubQuery, sql`true`)
    .orderBy(desc(recipe.createdAt))
    .limit(limit);
  
  return (
    <UserInfoCarousel 
      header="Created Recipes"
      href={`/user/${userId}/recipes/created` as Route}
      items={createdRecipes.map((r) => (
        <CreatedRecipesResult 
          key={r.id}
          recipe={r}
        />
      ))}
    />
  );
}
