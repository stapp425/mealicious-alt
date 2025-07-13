import { db } from "@/db";
import { diet, nutrition, recipe, recipeToDiet, recipeToNutrition, savedRecipe, user } from "@/db/schema";
import { sql, eq, and, not, exists } from "drizzle-orm";
import { Clock, Flame } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import UserInfoCarousel from "./user-info-carousel";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import defaultProfilePicture from "@/img/default/default-pfp.svg";
import Link from "next/link";
import { getNickname } from "@/lib/utils";

type SavedRecipesProps = {
  userId: string;
  limit: number;
};

const MAX_DIET_DISPLAY_LIMIT = 3;

export default async function SavedRecipes({ userId, limit }: SavedRecipesProps) {
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
    nickname: user.nickname,
    email: user.email,
    image: user.image
  }).from(user)
    .where(eq(user.id, recipe.createdBy))
    .as("user_sub");

  const savedRecipes = await db.select({
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
      nickname: userSubQuery.nickname,
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
      href={`/user/${userId}/recipes?option=saved`}
      items={savedRecipes.map((r) => (
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
                    alt={`Profile picture of ${r.creator.nickname}`}
                  />
                  <AvatarFallback className="bg-mealicious-primary text-white">
                    {getNickname(r.creator).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{getNickname(r.creator)}</span>
              </div>
            )
          }
        </Link>
      ))}
    />
  );
}
