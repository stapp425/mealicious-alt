"use client";

import { ArrowDownToLine, Clock, Earth, Heart, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

type RecipeResultProps = {
  recipe: {
    id: string;
    title: string;
    image: string;
    prepTime: string;
    sourceName: string | null;
    sourceUrl: string | null;
    cuisine: {
      id: string;
      adjective: string;
      icon: string;
    } | null;
    recipeStatistics: {
      savedCount: number;
      favoriteCount: number;
      fiveStarCount: number;
      fourStarCount: number;
      threeStarCount: number;
      twoStarCount: number;
      oneStarCount: number;
    };
  };
};

export default function RecipeResult({ recipe }: RecipeResultProps) {
  const { push } = useRouter();

  const totalReviewCount = 
    recipe.recipeStatistics.fiveStarCount + 
    recipe.recipeStatistics.fourStarCount + 
    recipe.recipeStatistics.threeStarCount + 
    recipe.recipeStatistics.twoStarCount + 
    recipe.recipeStatistics.oneStarCount;

  const overallRating = (
    recipe.recipeStatistics.fiveStarCount * 5 + 
    recipe.recipeStatistics.fourStarCount * 4 + 
    recipe.recipeStatistics.threeStarCount * 3 + 
    recipe.recipeStatistics.twoStarCount * 2 + 
    recipe.recipeStatistics.oneStarCount * 1
  ) / totalReviewCount || 0;
  
  return (
    <div 
      onClick={() => push(`/recipes/${recipe.id}`)}
      className="cursor-pointer relative bg-sidebar hover:bg-muted border border-border flex flex-col items-start gap-4 rounded-md p-4 transition-colors"
    >
      <div className="relative w-full h-[300px] sm:h-[175px] p-3">
        <Image 
          src={recipe.image}
          alt={`Image of ${recipe.title}`}
          fill
          className="rounded-sm object-cover"
        />
        {
          recipe.sourceUrl && (
            <Link
              href={recipe.sourceUrl}
              target="_blank"
              className="absolute bottom-2 left-2 bg-white text-black p-1.5 rounded-sm"
            >
              <Earth size={20}/>
            </Link>
          )
        }
      </div>
      <div className="w-full flex justify-between items-start gap-3">
        <h2 className="font-bold line-clamp-2 text-left text-wrap hyphens-auto truncate">{recipe.title}</h2>
        {
          recipe.cuisine && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Image 
                  src={recipe.cuisine.icon}
                  alt={`Flag of ${recipe.cuisine.adjective} cuisine`}
                  width={35}
                  height={35}
                  className="object-cover rounded-full"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{recipe.cuisine.adjective}</p>
              </TooltipContent>
            </Tooltip>
          )
        }
      </div>
      <div className="flex items-center gap-2 font-semibold text-sm mt-auto">
        <Clock size={14}/>
        {Math.floor(Number(recipe.prepTime))} mins
      </div>
      <div className="w-full border border-border flex items-center rounded-sm">
        <div className="flex-1 flex flex-col justify-center items-center gap-0.75 py-2 rounded-sm">
          <Star size={28} fill="#ffba00" strokeWidth={0}/>
          <span className="font-semibold">{overallRating > 0 ? overallRating.toFixed(1) : "-"}</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex-1 flex flex-col justify-center items-center gap-0.75 py-2 rounded-sm">
          <Heart size={28} fill="#ff637e" strokeWidth={0}/>
          <span className="font-semibold">{recipe.recipeStatistics.favoriteCount || "-"}</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex-1 flex flex-col justify-center items-center gap-0.75 py-2 rounded-sm">
          <ArrowDownToLine size={28}/>
          <span className="font-semibold">{recipe.recipeStatistics.favoriteCount || "-"}</span>
        </div>
      </div>
    </div>
  );
}
