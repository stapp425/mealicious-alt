import { db } from "@/db";
import { diet as dietTable, recipeToDiet, dishType as dishTypeTable, cuisine as cuisineTable, recipeToDishType, recipe } from "@/db/schema";
import { MAX_GRID_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import Pagination from "@/components/recipes/search/pagination";
import { and, count, eq, exists, ilike } from "drizzle-orm";
import { Info, SearchX } from "lucide-react";
import RecipeResult from "@/components/recipes/search/recipe-result";

type SearchResultsProps = {
  query: string;
  cuisine: string;
  diet: string;
  dishType: string;
  page: number;
};

export default async function SearchResults({ query, cuisine, diet, dishType, page }: SearchResultsProps) {  
  const searchRecipesQuery = db.query.recipe.findMany({
    columns: {
      id: true,
      title: true,
      image: true,
      prepTime: true,
      sourceName: true,
      sourceUrl: true
    },
    where: (recipe, { and, eq, ilike, exists }) => and(
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
    ),
    with: {
      recipeStatistics: {
        columns: {
          recipeId: false
        }
      },
      cuisine: {
        columns: {
          id: true,
          adjective: true,
          icon: true
        }
      }
    },
    limit: MAX_GRID_RECIPE_DISPLAY_LIMIT,
    offset: page * MAX_GRID_RECIPE_DISPLAY_LIMIT
  });

  const searchRecipesCountQuery = db.select({ count: count() })
    .from(recipe)
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
    ));

  const [searchedRecipes, [{ count: searchedRecipesCount }]] = await Promise.all([searchRecipesQuery, searchRecipesCountQuery]);
  const totalPages = Math.ceil(searchedRecipesCount / MAX_GRID_RECIPE_DISPLAY_LIMIT);

  return (
    <div className="flex-1 w-full flex flex-col gap-3">
      {
        searchedRecipes.length > 0 ? (
          <>
          <h2 className="font-bold text-2xl">
            Search Results ({searchedRecipesCount})
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
      <Pagination pages={totalPages}/>
    </div>
  );
}