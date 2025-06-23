import { auth } from "@/auth";
import { db } from "@/db";
import { meal, mealToRecipe, nutrition, recipe, recipeToNutrition } from "@/db/schema";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import MealResult from "@/components/meals/saved/meal-result";
import { cn } from "@/lib/utils";
import { Info, SearchX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/meals/saved/pagination";
import { Metadata } from "next";

const MAX_MEAL_DISPLAY = 6;

export const metadata: Metadata = {
  title: "All Meals | Mealicious",
  description: "View all your mealicious meals here!"
};

export default async function Page() {
  const session = await auth();
  
  if (!session?.user?.id)
    redirect("/login");
  
  const userId = session?.user?.id;
  
  const meals = await db.select({
    id: meal.id,
    title: meal.title,
    description: meal.description,
    type: meal.type,
    tags: meal.tags,
    calories: sql<number>`"meal_to_recipe_sub"."total_calories"`,
    recipes: sql<{
      id: string;
      title: string;
      image: string;
      description: string | null;
    }[]>`"meal_to_recipe_sub"."data"`
  }).from(meal)
    .where(eq(meal.createdBy, userId))
    .innerJoinLateral(
      db.select({
        sum: sql`sum("recipe_sub"."calories")`.as("total_calories"),
        data: sql`
          coalesce(
            json_agg("recipe_sub"."data"),
            '[]'::json
          )
        `.as("data")
      }).from(mealToRecipe)
      .where(eq(mealToRecipe.mealId, meal.id))
      .leftJoinLateral(
        db.select({
          calories: sql`"recipe_to_nutrition_sub"."calories"`.as("calories"),
          data: sql`
            json_build_object(
              'id', ${recipe.id},
              'title', ${recipe.title},
              'image', ${recipe.image},
              'description', ${recipe.description}
            )
          `.as("data")
        }).from(recipe)
          .where(eq(mealToRecipe.recipeId, recipe.id))
          .innerJoinLateral(
            db.select({
              calories: sql`coalesce(${recipeToNutrition.amount}, 0)`.as("calories")
            }).from(recipeToNutrition)
              .where(
                and(
                  eq(recipeToNutrition.recipeId, recipe.id),
                  eq(nutrition.name, "Calories")
                )
              )
              .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
              .as("recipe_to_nutrition_sub"),
            sql`true`
          )
          .as("recipe_sub"),
        sql`true`
      )
      .as("meal_to_recipe_sub"),
      sql`true`
    );
  
  return (
    <div className="flex-1 max-w-[1000px] w-full flex flex-col gap-3 mx-auto p-4">
      <h1 className="font-bold text-4xl">All Meals</h1>
      <Separator />
      <div className="flex w-full items-center gap-2 text-sm">
        <Info size={16}/>
        You can click on a recipe&apos;s search icon to show more details.
      </div>
      <div className={cn(
        meals.length > 0
          ? "w-full grid lg:grid-cols-2 gap-3"
          : "bg-sidebar border border-border w-full flex flex-col justify-center items-center gap-6 py-10 px-8 rounded-md"
      )}>
        {
          meals.length > 0 ? (
            <>{meals.map((m) => <MealResult key={m.id} meal={m}/>)}</> 
          ) : (
            <>
            <SearchX size={60}/>
            <div className="flex flex-col items-center gap-2">
              <h3 className="font-bold text-lg mt-auto">No Meal Found!</h3>
              <span className="font-semibold text-center text-muted-foreground">Try making another search or start creating one!</span>
            </div>
            </>
          )
        }
      </div>
      <Pagination totalPages={Math.ceil(meals.length / MAX_MEAL_DISPLAY)}/>
    </div>
  );
}
