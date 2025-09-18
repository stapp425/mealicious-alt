import { db } from "@/db";
import { nutrition, recipe, recipeToNutrition, savedRecipe } from "@/db/schema";
import { and, eq, not, sql, desc } from "drizzle-orm";
import MostRecentSavedRecipesInfo from "@/components/dashboard/most-recent-saved-recipes-info";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";

type MostRecentSavedRecipesProps = {
  userId: string;
};

const MAX_SAVED_RECIPE_DISPLAY_LIMIT = 20;

export default async function MostRecentSavedRecipes({ userId }: MostRecentSavedRecipesProps) {
  const caloriesSubQuery = db.select({
    calories: recipeToNutrition.amount
  }).from(recipeToNutrition)
    .where(and(
      eq(recipeToNutrition.recipeId, recipe.id),
      eq(nutrition.name, "Calories")
    ))
    .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
    .as("recipe_to_nutrition_sub");

  const savedRecipesSubQuery = db.select({
    saveDate: savedRecipe.saveDate
  }).from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, userId),
      eq(savedRecipe.recipeId, recipe.id),
    ))
    .as("saved_recipes_sub");
  
  const savedRecipes = await db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    description: recipe.description,
    prepTime: recipe.prepTime,
    calories: sql`coalesce(${caloriesSubQuery.calories}, 0)`.mapWith(Number),
    saveDate: savedRecipesSubQuery.saveDate
  }).from(recipe)
    .where(not(eq(recipe.createdBy, userId))) // ignore if current user is the author of the recipe
    .innerJoinLateral(savedRecipesSubQuery, sql`true`)
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .orderBy(desc(savedRecipesSubQuery.saveDate))
    .limit(MAX_SAVED_RECIPE_DISPLAY_LIMIT);

  if (!savedRecipes.length) {
    return (
      <div className="flex flex-col">
        <h1 className="font-bold text-2xl mb-3">Most Recent Saved Recipes</h1>
        <div className="bg-sidebar border border-border text-muted-foreground text-center font-semibold min-h-112 flex flex-col justify-center items-center gap-6 rounded-md">
          <SearchX size={72} className="stroke-muted-foreground"/>
          <span className="text-lg">No Saved Recipes Found!</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-2xl mb-3">Most Recent Saved Recipes</h1>
      <MostRecentSavedRecipesInfo savedRecipes={savedRecipes}/>
    </div>
  );
}

export function MostRecentSavedRecipesSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="w-48 h-8 rounded-sm"/>
      <Skeleton className="h-125 rounded-sm"/>
    </div>
  );
}
