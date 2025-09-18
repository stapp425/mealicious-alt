import { db } from "@/db";
import { recipe, recipeFavorite, savedRecipe } from "@/db/schema";
import { getCachedData } from "@/lib/actions/redis";
import { CountSchema } from "@/lib/zod";
import { and, count, eq, exists, not } from "drizzle-orm";
import { ArrowDownToLine, Eye, Heart, Pencil } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Route } from "next";

type RecipeCountProps = {
  userId: string;
};

export default async function RecipeCount({ userId }: RecipeCountProps) {
  const createdRecipesCountQuery = getCachedData({
    cacheKey: `user_${userId}_created_recipes_count`,
    schema: CountSchema,
    timeToLive: 60 * 10, // 10 minutes
    call: () => db.select({ count: count() })
      .from(recipe)
      .where(eq(recipe.createdBy, userId))
  });

  const savedRecipesCountQuery = getCachedData({
    cacheKey: `user_${userId}_saved_recipes_count`,
    schema: CountSchema,
    timeToLive: 60 * 10, // 10 minutes
    call: () => db.select({ count: count() })
      .from(recipe)
      .where(and(
        not(eq(recipe.createdBy, userId)),
        exists(
          db.select()
            .from(savedRecipe)
            .where(and(
              eq(savedRecipe.recipeId, recipe.id),
              eq(savedRecipe.userId, userId)
            )) // exclude created recipes
        )
      ))
  });

  const favoritedRecipesCountQuery = getCachedData({
    cacheKey: `user_${userId}_favorited_recipes_count`,
    schema: CountSchema,
    timeToLive: 60 * 10, // 10 minutes
    call: () => db.select({ count: count() })
      .from(recipeFavorite)
      .where(eq(recipeFavorite.userId, userId))
  });

  const [
    createdRecipesCount,
    savedRecipesCount,
    favoritedRecipesCount
  ] = await Promise.all([
    createdRecipesCountQuery,
    savedRecipesCountQuery,
    favoritedRecipesCountQuery
  ]);

  const recipesCount = [
    {
      id: "created-recipes-count",
      label: "Created Recipes",
      icon: Pencil,
      count: createdRecipesCount,
      href: "/recipes?filters=created"
    },
    {
      id: "saved-recipes-count",
      label: "Saved Recipes",
      icon: ArrowDownToLine,
      count: savedRecipesCount,
      href: "/recipes"
    },
    {
      id: "favorited-recipes-count",
      label: "Favorited Recipes",
      icon: Heart,
      count: favoritedRecipesCount,
      href: "/recipes?filters=favorited"
    }
  ];
  
  return (
    <div className="flex flex-col @min-2xl:flex-row items-center gap-2.5">
      {
        recipesCount.map((c) => (
          <div key={c.id} className="relative bg-mealicious-primary text-white w-full @min-2xl:w-auto @min-2xl:flex-1 h-32 flex flex-col gap-8 p-3 rounded-md overflow-hidden">
            <c.icon
              size={96}
              className="absolute stroke-mealicious-primary-muted bottom-0 left-0 opacity-33 dark:opacity-16"
            />
            <h2 className="absolute top-3 left-3 font-bold text-lg">{c.label}</h2>
            <div className="absolute top-3 right-3 size-8 bg-white flex justify-center items-center rounded-full">
              <c.icon
                size={16}
                className="stroke-black shrink-0"
              />
            </div>
            <h2 className="absolute bottom-3 left-3 font-bold text-4xl -mb-1.5">{c.count}</h2>
            <Link href={c.href as Route} className="absolute bottom-3 right-3 cursor-pointer bg-white hover:bg-slate-300 text-black text-sm flex items-center gap-2 py-1 px-3 rounded-full transition-colors">
              <span className="font-semibold">View</span>
              <Eye size={18}/>
            </Link>
          </div>
        ))
      }
    </div>
  );
}

export function RecipeCountSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2.5">
      {
        Array.from({ length: 3 }, (_, i) => i).map((i) => (
          <Skeleton
            key={i}
            className="flex-1 h-32 rounded-md"
          />
        ))
      }
    </div>
  );
}
