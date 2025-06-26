import { db } from "@/db";
import { 
  diet as dietTable, recipeToDiet,
  dishType as dishTypeTable,
  cuisine as cuisineTable,
  recipeToDishType, recipe,
  user,
  recipeStatistics,
  recipeToNutrition,
  nutrition
} from "@/db/schema";
import { MAX_GRID_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import { and, eq, exists, ilike, sql } from "drizzle-orm";
import { Info, SearchX } from "lucide-react";
import RecipeResult from "@/components/recipes/search/recipe-result";

type SearchResultsProps = {
  count: number;
  searchParams: {
    query: string;
    cuisine: string;
    diet: string;
    dishType: string;
    page: number;
  }
};

export default async function SearchResults({ count, searchParams }: SearchResultsProps) {  
  const { query, cuisine, diet, dishType, page } = searchParams;
  
  const searchedRecipes = await db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    prepTime: recipe.prepTime,
    calories: sql<number>`"recipe_to_nutrition_sub"."calories"`.as("calories"),
    creator: sql<{
      id: string;
      name: string;
      image: string | null;
    } | null>`"creator_sub"."data"`.as("creator"),
    statistics: sql<{
      saveCount: number;
      favoriteCount: number;
      fiveStarCount: number;
      fourStarCount: number;
      threeStarCount: number;
      twoStarCount: number;
      oneStarCount: number;
    }>`"recipe_stats_sub"."data"`.as("stats"),
    cuisine: sql<{
      id: string;
      adjective: string;
      icon: string;
    } | null>`"cuisine_sub"."data"`.as("cuisine"),
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
    createdAt: recipe.createdAt
  }).from(recipe)
    .where(and(
      eq(recipe.isPublic, true),
      ilike(recipe.title, `%${query}%`),
      diet ? exists(
        db.select()
          .from(recipeToDiet)
          .innerJoin(dietTable, eq(recipeToDiet.dietId, dietTable.id))
          .where(and(
            eq(recipeToDiet.recipeId, recipe.id),
            ilike(dietTable.name, `%${diet}%`),
          ))
      ) : undefined,
      dishType ? exists(
        db.select()
          .from(recipeToDishType)
          .innerJoin(dishTypeTable, eq(recipeToDishType.dishTypeId, dishTypeTable.id))
          .where(and(
            eq(recipeToDishType.recipeId, recipe.id),
            ilike(dishTypeTable.name, `%${dishType}%`),
          ))
      ) : undefined,
      cuisine ? exists(
        db.select()
          .from(cuisineTable)
          .where(and(
            eq(cuisineTable.id, recipe.cuisineId),
            ilike(cuisineTable.adjective, `%${cuisine}%`)
          ))
      ) : undefined
    ))
    .leftJoinLateral(
      db.select({
        data: sql`
          json_build_object(
            'id', ${user.id},
            'name', ${user.name},
            'image', ${user.image}
          )
        `.as("data")
      }).from(user)
        .where(eq(recipe.createdBy, user.id))
        .as("creator_sub"),
      sql`true`
    )
    .innerJoinLateral(
      db.select({
        data: sql`
          json_build_object(
            'saveCount', ${recipeStatistics.savedCount},
            'favoriteCount', ${recipeStatistics.favoriteCount},
            'fiveStarCount', ${recipeStatistics.fiveStarCount},
            'fourStarCount', ${recipeStatistics.fourStarCount},
            'threeStarCount', ${recipeStatistics.threeStarCount},
            'twoStarCount', ${recipeStatistics.twoStarCount},
            'oneStarCount', ${recipeStatistics.oneStarCount}
          )
        `.as("data")
      }).from(recipeStatistics)
        .where(eq(recipeStatistics.recipeId, recipe.id))
        .as("recipe_stats_sub"),
      sql`true`
    )
    .leftJoinLateral(
      db.select({
        data: sql`
          json_build_object(
            'id', ${cuisineTable.id},
            'adjective', ${cuisineTable.adjective},
            'icon', ${cuisineTable.icon}
          )
        `.as("data")
      }).from(cuisineTable)
        .where(eq(cuisineTable.id, recipe.cuisineId))
        .as("cuisine_sub"),
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
    .limit(MAX_GRID_RECIPE_DISPLAY_LIMIT)
    .offset(page * MAX_GRID_RECIPE_DISPLAY_LIMIT);

  return (
    <div className="flex-1 w-full flex flex-col gap-3">
      {
        searchedRecipes.length > 0 ? (
          <>
          <h2 className="font-bold text-2xl text-left">
            Search Results ({count})
          </h2>
          <div className="flex w-full items-center gap-2 text-sm">
            <Info size={16}/>
            You can click on a recipe to show more details.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {searchedRecipes.map((r) => <RecipeResult key={r.id} recipe={r}/>)}
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