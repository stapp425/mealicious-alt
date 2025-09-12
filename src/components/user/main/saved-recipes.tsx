import { db } from "@/db";
import { diet, nutrition, recipe, recipeToDiet, recipeToNutrition, savedRecipe, user } from "@/db/schema";
import { sql, eq, and, not, exists } from "drizzle-orm";
import UserInfoCarousel from "@/components/user/main/user-info-carousel";
import SavedRecipesResult from "@/components/user/main/saved-recipes-result";
import { Route } from "next";

type SavedRecipesProps = {
  userId: string;
  limit: number;
};

const MAX_DIET_DISPLAY_LIMIT = 3;

export default async function SavedRecipes({ userId, limit }: SavedRecipesProps) {
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

  const userSubQuery = db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image
  }).from(user)
    .where(eq(user.id, recipe.createdBy))
    .as("user_sub");

  const savedRecipes = await db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    prepTime: sql`${recipe.prepTime}`.mapWith(Number),
    calories: sql`coalesce(${caloriesSubQuery.calories}, 0)`.mapWith(Number),
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
    .limit(limit);
  
  return (
    <UserInfoCarousel 
      header="Saved Recipes"
      href={`/user/${userId}/recipes/saved` as Route}
      items={savedRecipes.map((r) => (
        <SavedRecipesResult 
          key={r.id}
          recipe={r}
        />
      ))}
    />
  );
}
