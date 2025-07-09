import { db } from "@/db";
import { diet, nutrition, recipe, recipeFavorite, recipeToDiet, recipeToNutrition, user } from "@/db/schema";
import { getDataWithCache } from "@/lib/actions/redis";
import { sql, and, eq, exists, count } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import z from "zod";
import { Clock, Flame, SearchX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import defaultProfilePicture from "@/img/default/default-pfp.svg";
import Pagination from "@/components/user/recipes/pagination";

type FavoritedRecipesProps = {
  userId: string;
  limit: number;
};

const MAX_DIET_DISPLAY_LIMIT = 3;

export default async function FavoritedRecipes({ userId, limit }: FavoritedRecipesProps) {
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
    image: user.image
  }).from(user)
    .where(eq(user.id, recipe.createdBy))
    .as("user_sub");

  const favoritedRecipesQuery = db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    prepTime: sql`${recipe.prepTime}`.mapWith((val) => Number(val)),
    calories: caloriesSubQuery.calories,
    diets: sql<{
      id: string;
      name: string;
    }[]>`coalesce(${recipeToDietSubQuery.diets}, '[]'::json)`,
    creator: {
      id: userSubQuery.id,
      name: userSubQuery.name,
      image: userSubQuery.image
    }
  }).from(recipe)
    .where(and(
      eq(recipe.isPublic, true),
      exists(
        db.select()
          .from(recipeFavorite)
          .where(and(
            eq(recipeFavorite.recipeId, recipe.id),
            eq(recipeFavorite.userId, userId)
          ))
      )
    ))
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .leftJoinLateral(recipeToDietSubQuery, sql`true`)
    .leftJoinLateral(userSubQuery, sql`true`)
    .limit(limit);

  const favoritedRecipesCountQuery = db.select({ count: count() })
    .from(recipe)
    .where(and(
      eq(recipe.isPublic, true),
      exists(
        db.select()
          .from(recipeFavorite)
          .where(and(
            eq(recipeFavorite.recipeId, recipe.id),
            eq(recipeFavorite.userId, userId)
          ))
      )
    ));
  
  const [[{ count: favoritedRecipesCount }], favoritedRecipes] = await Promise.all([
    getDataWithCache({
      cacheKey: `favorited_recipes_user_${userId}`,
      timeToLive: 120,
      call: () => favoritedRecipesCountQuery,
      schema: z.array(z.object({
        count: z.number()
      })).length(1)
    }),
    favoritedRecipesQuery
  ]);

  if (favoritedRecipes.length === 0) {
    return (
      <section className="flex flex-col justify-center gap-2">
        <h1 className="font-bold text-xl">Favorited Recipes ({favoritedRecipesCount})</h1>
        <div className="border border-border bg-sidebar min-h-[250px] flex flex-col justify-center items-center gap-4 py-12 rounded-md">
          <SearchX size={48}/>
          <h3 className="font-bold text-lg">No favorited recipes yet...</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col gap-3">
      <h1 className="font-bold text-xl">Favorited Recipes ({favoritedRecipesCount})</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {
          favoritedRecipes.map((r) => (
            <Link 
              key={r.id}
              href={`/recipes/${r.id}`}
              className="cursor-pointer h-full flex flex-col gap-3 bg-sidebar hover:bg-muted border border-border overflow-hidden p-4 rounded-md transition-colors"
            >
              <div className="relative h-[150px]">
                <Image 
                  src={r.image}
                  alt={`Image of ${r.title}`}
                  fill
                  className="object-cover object-center rounded-sm"
                />
              </div>
              <h2 className="font-bold text-lg">{r.title}</h2>
              {
                r.diets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {
                      r.diets.slice(0, 4).map((d) => (
                        <div key={d.id} className="bg-mealicious-primary font-semibold text-white text-xs py-1 px-4 rounded-full">
                          {d.name}
                        </div>
                      ))
                    }
                  </div>
                )
              }
              <div className="flex items-center gap-3 min-h-[25px] mt-auto">
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <Flame size={14} fill="var(--primary)"/>
                  <span>{Number(r.calories).toLocaleString()} Calories</span>
                </div>
                <Separator orientation="vertical"/>
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <Clock size={14}/>
                  <span>{Math.floor(r.prepTime)} min</span>
                </div>
              </div>
              {
                r.creator && (
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage 
                        src={r.creator.image || defaultProfilePicture}
                        alt={`Profile picture of ${r.creator.name}`}
                      />
                      <AvatarFallback className="bg-mealicious-primary text-white">
                        {r.creator.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{r.creator.name}</span>
                  </div>
                )
              }
            </Link>
          ))
        }
      </div>
      <Pagination totalPages={Math.ceil(favoritedRecipesCount / limit)}/>
    </section>
  );
}
