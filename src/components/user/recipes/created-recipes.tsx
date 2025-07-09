import { db } from "@/db";
import { diet, nutrition, recipe, recipeToDiet, recipeToNutrition } from "@/db/schema";
import { getDataWithCache } from "@/lib/actions/redis";
import { sql, and, eq, desc, count } from "drizzle-orm";
import z from "zod";
import Pagination from "./pagination";
import Link from "next/link";
import Image from "next/image";
import { Clock, Flame, SearchX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, isSameDay } from "date-fns";
import { tz } from "@date-fns/tz";

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
    calories: caloriesSubQuery.calories,
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

  const [[{ count: createdRecipesCount }], createdRecipes] = await Promise.all([
    getDataWithCache({
      cacheKey: `created_recipes_user_${userId}`,
      timeToLive: 120,
      call: () => createdRecipesCountQuery,
      schema: z.array(z.object({
        count: z.number()
      })).length(1)
    }),
    createdRecipesQuery
  ]);

  if (createdRecipes.length === 0) {
    return (
      <section className="flex flex-col justify-center gap-2">
        <h1 className="font-bold text-xl">Created Recipes ({createdRecipesCount})</h1>
        <div className="border border-border bg-sidebar min-h-[250px] flex flex-col justify-center items-center gap-4 py-12 rounded-md">
          <SearchX size={48}/>
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
                !isSameDay(r.createdAt, r.updatedAt, { in: tz("UTC") }) && (
                  <span className="italic text-muted-foreground text-sm">
                    Last updated on {format(r.updatedAt, "MMM d, yyyy")}
                  </span>
                )
              }
              <span className="italic text-muted-foreground text-sm">
                Created on {format(r.createdAt, "MMM d, yyyy")}
              </span>
            </Link>
          ))
        }
      </div>
      <Pagination totalPages={Math.ceil(createdRecipesCount / limit)}/>
    </section>
  );
}