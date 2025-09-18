import { db } from "@/db";
import { cuisine, diet, nutrition, recipe, recipeToDiet, recipeToNutrition, savedRecipe } from "@/db/schema";
import { tz } from "@date-fns/tz";
import { endOfDay, startOfDay } from "date-fns";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import PopularRecipesInfo from "@/components/dashboard/popular-recipes-info";
import { Skeleton } from "@/components/ui/skeleton";

const now = new Date();
const MAX_RECIPE_DISPLAY_LIMIT = 3;
const MAX_DIET_DISPLAY_LIMIT = 3;
const inUtc = { in: tz("UTC") };

export default async function PopularRecipes() {
  const savedRecipeSubQuery = db.select({ count: count().as("count") })
    .from(savedRecipe)
    .where(and(
      eq(savedRecipe.recipeId, recipe.id),
      gte(savedRecipe.saveDate, startOfDay(now, inUtc)),
      lt(savedRecipe.saveDate, endOfDay(now, inUtc))
    ))
    .as("saved_recipe_sub");
  
  const caloriesSubQuery = db.select({
    calories: recipeToNutrition.amount
  }).from(recipeToNutrition)
    .where(and(
      eq(recipeToNutrition.recipeId, recipe.id),
      eq(nutrition.name, "Calories")
    ))
    .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
    .as("recipe_to_nutrition_sub");

  const cuisineSubQuery = db.select({
    id: cuisine.id,
    adjective: cuisine.adjective,
    icon: cuisine.icon
  }).from(cuisine)
    .where(eq(cuisine.id, recipe.cuisineId))
    .as("cuisine_sub");
  
  const dietSubQuery = db.select({
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
    diets: sql`coalesce(json_agg(${dietSubQuery.diet}), '[]'::json)`.as("diets")
  }).from(dietSubQuery)
    .as("recipe_to_diet_sub");
  
  const popularRecipes = await db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    description: recipe.description,
    prepTime: recipe.prepTime,
    calories: sql`coalesce(${caloriesSubQuery.calories}, 0)`.mapWith(Number),
    saveCount: sql`coalesce(${savedRecipeSubQuery.count}, 0)`.mapWith(Number),
    diets: sql<{
      id: string;
      name: string;
      description: string;
    }[]>`coalesce(${recipeToDietSubQuery.diets}, '[]'::json)`,
    cuisine: sql<{
      id: string;
      icon: string;
      adjective: string;
    } | null>`
      json_build_object(
        'id', ${cuisineSubQuery.id},
        'icon', ${cuisineSubQuery.icon},
        'adjective', ${cuisineSubQuery.adjective}
      )
    `
  }).from(recipe)
    .where(eq(recipe.isPublic, true))
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .leftJoinLateral(savedRecipeSubQuery, sql`true`)
    .leftJoinLateral(cuisineSubQuery, sql`true`)
    .leftJoinLateral(recipeToDietSubQuery, sql`true`)
    .orderBy(desc(savedRecipeSubQuery.count))
    .limit(MAX_RECIPE_DISPLAY_LIMIT);
  
  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-2xl">Popular Recipes</h1>
      <span className="text-muted-foreground mb-3">The {MAX_RECIPE_DISPLAY_LIMIT} most saved recipes from the previous day will be shown here.</span>
      <PopularRecipesInfo popularRecipes={popularRecipes}/>
    </div>
  );
}

export function PopularRecipesSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="w-48 h-8 rounded-sm"/>
      <Skeleton className="w-60 h-6 rounded-sm"/>
      <Skeleton className="h-75"/>
    </div>
  );
}
