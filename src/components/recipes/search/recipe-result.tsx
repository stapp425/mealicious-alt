"use client";

import { ArrowDownToLine, Beef, Clock, Earth, Flame, Heart, IceCreamBowl, Salad, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { getDateDifference } from "@/lib/utils";
import { useMemo } from "react";

type RecipeResultProps = {
  isUsingCuisinePreferences: boolean;
  isUsingDietPreferences: boolean;
  isUsingDishTypePreferences: boolean;
  recipe: {
    id: string;
    title: string;
    image: string;
    prepTime: number;
    calories: number;
    creator: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
    statistics: {
      saveCount: number;
      favoriteCount: number;
      fiveStarCount: number;
      fourStarCount: number;
      threeStarCount: number;
      twoStarCount: number;
      oneStarCount: number;
    };
    cuisine: {
      id: string;
      adjective: string;
      icon: string;
    } | null;
    sourceName: string | null;
    sourceUrl: string | null;
    cuisineScore: number;
    dietScore: number;
    dishTypeScore: number;
    createdAt: Date;
  };
};

export default function RecipeResult({
  recipe,
  isUsingCuisinePreferences,
  isUsingDietPreferences,
  isUsingDishTypePreferences
}: RecipeResultProps) {
  const { push } = useRouter();

  const totalReviewCount = 
    recipe.statistics.fiveStarCount + 
    recipe.statistics.fourStarCount + 
    recipe.statistics.threeStarCount + 
    recipe.statistics.twoStarCount + 
    recipe.statistics.oneStarCount;

  const overallRating = (
    recipe.statistics.fiveStarCount * 5 + 
    recipe.statistics.fourStarCount * 4 + 
    recipe.statistics.threeStarCount * 3 + 
    recipe.statistics.twoStarCount * 2 + 
    recipe.statistics.oneStarCount * 1
  ) / totalReviewCount || 0;

  const scores = useMemo(() => [
    {
      active: isUsingCuisinePreferences,
      Icon: Salad,
      predicate: "Cuisine Score",
      amount: recipe.cuisineScore
    },
    {
      active: isUsingDietPreferences,
      Icon: IceCreamBowl,
      predicate: "Diet Score",
      amount: recipe.dietScore
    },
    {
      active: isUsingDishTypePreferences,
      Icon: Beef,
      predicate: "Dish Type Score",
      amount: recipe.dishTypeScore
    }
  ], [
    isUsingCuisinePreferences,
    isUsingDietPreferences,
    isUsingDishTypePreferences,
    recipe.cuisineScore,
    recipe.dietScore,
    recipe.dishTypeScore
  ]);
  
  return (
    <div
      onClick={() => push(`/recipes/${recipe.id}`)}
      className="group cursor-pointer relative dark:bg-sidebar border border-border flex flex-col items-start gap-2.5 rounded-md p-4 transition-colors"
    >
      <div className="relative w-full h-64 rounded-sm overflow-hidden">
        <Image 
          src={recipe.image}
          alt={`Image of ${recipe.title}`}
          fill
          className="object-cover"
        />
        <div className="size-full"/>
          {
            recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                className="absolute bottom-3 left-3 bg-white text-black p-1.5 rounded-sm"
              >
                <Earth size={20}/>
              </a>
            )
          }
          {
            recipe.cuisine && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image 
                    src={recipe.cuisine.icon}
                    alt={`Flag of ${recipe.cuisine.adjective} cuisine`}
                    width={35}
                    height={35}
                    className="absolute bottom-3 right-3 object-cover rounded-full"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{recipe.cuisine.adjective}</p>
                </TooltipContent>
              </Tooltip>
            )
          }
        </div>
      <h2 className="max-w-full font-bold text-left line-clamp-3 capitalize text-wrap hyphens-auto truncate">{recipe.title}</h2>
      <ul className="flex flex-col gap-1.5 empty:hidden">
        {
          scores.filter((s) => s.active).map(({ Icon, predicate, amount }) => (
            <li key={predicate} className="flex items-center gap-2">
              <div className="bg-mealicious-primary size-6 flex justify-center items-center rounded-full">
                <Icon className="size-4 stroke-white shrink-0"/>
              </div>
              <span className="text-sm text-muted-foreground">{predicate}: {amount}</span>
            </li>
          ))
        }
      </ul>
      <div className="flex items-center gap-3 min-h-6">
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Flame size={14} className="fill-primary"/>
          <span>{recipe.calories.toLocaleString()} Calories</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Clock size={14}/>
          <span>{Math.floor(recipe.prepTime)} min</span>
        </div>
      </div>
      {
        recipe.creator && (
          <Tooltip>
            <Link 
              href={`/user/${recipe.creator.id}`}
              onClick={(e) => e.stopPropagation()}
              prefetch={false}
              className="group/user flex items-center gap-2"
            >
              <div className="relative size-8 rounded-full overflow-hidden">
                <Image 
                  src={recipe.creator.image || defaultProfilePicture}
                  alt={`Profile picture of ${recipe.creator.name}`}
                  fill
                  className="object-cover object-center bg-slate-100"
                />
              </div>
              <span className="font-semibold group-hover/user:underline text-sm">{recipe.creator.name}</span>
            </Link>
          </Tooltip>
        )
      }
      <div className="min-h-6 flex items-center gap-3 mt-auto">
        <div className="flex-1 flex items-center gap-1.25 rounded-sm">
          <Star 
            className="fill-amber-400 size-5"
            strokeWidth={0}
          />
          <span className="font-semibold">{overallRating > 0 ? overallRating.toFixed(1) : "-"}</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex-1 flex items-center gap-1.25 rounded-sm">
          <Heart 
            className="fill-rose-400 size-5"
            strokeWidth={0}
          />
          <span className="font-semibold">{recipe.statistics.favoriteCount || "-"}</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex-1 flex items-center gap-1.25 rounded-sm">
          <ArrowDownToLine className="stroke-muted-foreground size-5"/>
          <span className="font-semibold">{recipe.statistics.saveCount || "-"}</span>
        </div>
      </div>
      <span className="text-muted-foreground text-sm">
        Created {getDateDifference({ earlierDate: recipe.createdAt })} ago
      </span>
    </div>
  );
}
