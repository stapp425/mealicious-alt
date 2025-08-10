import { db } from "@/db";
import { 
  diet as dietTable, recipeToDiet,
  dishType as dishTypeTable,
  cuisine as cuisineTable,
  recipeToDishType, recipe,
  user,
  recipeStatistics,
  recipeToNutrition,
  nutrition,
  userToCuisine,
  userToDiet,
  userToDishType
} from "@/db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_GRID_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import { and, asc, eq, exists, ilike, sql } from "drizzle-orm";
import { Info, SearchX } from "lucide-react";
import RecipeResult from "@/components/recipes/search/recipe-result";
import { auth } from "@/auth";

type SearchResultsProps = {
  count: number;
  searchParams: {
    query: string;
    cuisine: string;
    diet: string;
    dishType: string;
    page: number;
    isUsingCuisinePreferences: boolean;
    isUsingDietPreferences: boolean;
    isUsingDishTypePreferences: boolean;
  }
};

export default async function SearchResults({ count, searchParams }: SearchResultsProps) {  
  const session = await auth();
  const userId = session?.user?.id;
  const { 
    query,
    cuisine,
    diet,
    dishType,
    page,
    isUsingCuisinePreferences,
    isUsingDietPreferences,
    isUsingDishTypePreferences
  } = searchParams;
  
  const creatorSubQuery = db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image
  }).from(user)
    .where(eq(recipe.createdBy, user.id))
    .as("creator_sub");

  const recipeStatisticsSubQuery = db.select({
    savedCount: recipeStatistics.savedCount,
    favoriteCount: recipeStatistics.favoriteCount,
    fiveStarCount: recipeStatistics.fiveStarCount,
    fourStarCount: recipeStatistics.fourStarCount,
    threeStarCount: recipeStatistics.threeStarCount,
    twoStarCount: recipeStatistics.twoStarCount,
    oneStarCount: recipeStatistics.oneStarCount
  }).from(recipeStatistics)
    .where(eq(recipeStatistics.recipeId, recipe.id))
    .as("recipe_stats_sub");

  const cuisineSubQuery = db.select({
    id: cuisineTable.id,
    adjective: cuisineTable.adjective,
    icon: cuisineTable.icon
  }).from(cuisineTable)
    .where(eq(cuisineTable.id, recipe.cuisineId))
    .as("cuisine_sub");

  const caloriesSubQuery = db.select({
    calories: recipeToNutrition.amount
  }).from(recipeToNutrition)
    .where(and(
      eq(recipeToNutrition.recipeId, recipe.id),
      eq(nutrition.name, "Calories")
    ))
    .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
    .as("recipe_to_nutrition_sub");

  const preferencesOrdering = [
    isUsingCuisinePreferences && userId ? asc(
      db.select({ score: sql`coalesce(${userToCuisine.preferenceScore}, 0)` })
        .from(userToCuisine)
        .where(and(
          eq(userToCuisine.userId, userId),
          eq(userToCuisine.cuisineId, recipe.cuisineId)
        ))
        .limit(1)
    ) : undefined,
    isUsingDietPreferences && userId ? asc(
      db.select({ score: sql`coalesce(${userToDiet.preferenceScore}, 0)` })
        .from(userToDiet)
        .where(and(
          eq(userToDiet.userId, userId),
          exists(
            db.select()
              .from(recipeToDiet)
              .where(eq(userToDiet.dietId, recipeToDiet.dietId))
          )
        ))
        .limit(1)
    ) : undefined,
    isUsingDishTypePreferences && userId ? asc(
      db.select({ score: sql`coalesce(${userToDishType.preferenceScore}, 0)` })
        .from(userToDishType)
        .where(and(
          eq(userToDishType.userId, userId),
          exists(
            db.select()
              .from(recipeToDishType)
              .where(eq(userToDishType.dishTypeId, recipeToDishType.dishTypeId))
          )
        ))
        .limit(1)
    ) : undefined,
  ]

  const searchedRecipes = await db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    prepTime: recipe.prepTime,
    calories: sql<number>`coalesce(${caloriesSubQuery.calories}, 0)`,
    creator: {
      id: creatorSubQuery.id,
      name: creatorSubQuery.name,
      email: creatorSubQuery.email,
      image: creatorSubQuery.image
    },
    statistics: {
      saveCount: recipeStatisticsSubQuery.savedCount,
      favoriteCount: recipeStatisticsSubQuery.favoriteCount,
      fiveStarCount: recipeStatisticsSubQuery.fiveStarCount,
      fourStarCount: recipeStatisticsSubQuery.fourStarCount,
      threeStarCount: recipeStatisticsSubQuery.threeStarCount,
      twoStarCount: recipeStatisticsSubQuery.twoStarCount,
      oneStarCount: recipeStatisticsSubQuery.oneStarCount
    },
    cuisine: {
      id: cuisineSubQuery.id,
      adjective: cuisineSubQuery.adjective,
      icon: cuisineSubQuery.icon
    },
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
            eq(dietTable.name, diet),
          ))
      ) : undefined,
      dishType ? exists(
        db.select()
          .from(recipeToDishType)
          .innerJoin(dishTypeTable, eq(recipeToDishType.dishTypeId, dishTypeTable.id))
          .where(and(
            eq(recipeToDishType.recipeId, recipe.id),
            eq(dishTypeTable.name, dishType),
          ))
      ) : undefined,
      cuisine ? exists(
        db.select()
          .from(cuisineTable)
          .where(and(
            eq(cuisineTable.id, recipe.cuisineId),
            eq(cuisineTable.adjective, cuisine)
          ))
      ) : undefined
    ))
    .leftJoinLateral(creatorSubQuery, sql`true`)
    .innerJoinLateral(recipeStatisticsSubQuery, sql`true`)
    .leftJoinLateral(cuisineSubQuery, sql`true`)
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .limit(MAX_GRID_RECIPE_DISPLAY_LIMIT)
    .orderBy(...preferencesOrdering.filter((o) => !!o))
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

export function SearchResultsSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col gap-3">
      <Skeleton className="w-[225px] h-[35px] rounded-sm"/>
      <Skeleton className="w-[325px] h-[25px] rounded-sm"/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {
          Array.from({ length: MAX_GRID_RECIPE_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
            <Skeleton key={i} className="h-[500px] sm:h-[425px] rounded-md"/>
          ))
        }
      </div>
    </div>
  );
}
