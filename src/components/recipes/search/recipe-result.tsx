"use client";

import { ArrowDownToLine, Clock, Earth, Flame, Heart, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import defaultProfilePicture from "@/img/default/default-pfp.svg";
import { getDateDifference, getNickname } from "@/lib/utils";

type RecipeResultProps = {
  recipe: {
    id: string;
    title: string;
    image: string;
    prepTime: number;
    calories: number;
    creator: {
      id: string;
      nickname: string | null;
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
    createdAt: Date;
};
};

export default function RecipeResult({ recipe }: RecipeResultProps) {
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

  const resolvedNickname = recipe.creator ? getNickname({ nickname: recipe.creator.nickname, email: recipe.creator.email }) : "[deleted]";
  
  return (
    <div
      onClick={() => push(`/recipes/${recipe.id}`)}
      className="group cursor-pointer relative bg-sidebar border border-border flex flex-col items-start gap-2.5 rounded-md p-4 transition-colors"
    >
      <div className="relative w-full h-[300px] sm:h-[225px] rounded-sm overflow-hidden">
        <Image 
          src={recipe.image}
          alt={`Image of ${recipe.title}`}
          fill
          className="object-cover"
        />
        <div className="size-full"/>
          {
            recipe.sourceUrl && (
              <Link
                href={recipe.sourceUrl}
                onClick={(e) => e.stopPropagation()}
                prefetch={false}
                target="_blank"
                className="absolute bottom-3 left-3 bg-white text-black p-1.5 rounded-sm"
              >
                <Earth size={20}/>
              </Link>
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
                <TooltipContent align="start">
                  <p>{recipe.cuisine.adjective}</p>
                </TooltipContent>
              </Tooltip>
            )
          }
        </div>
      <h2 className="font-bold line-clamp-2 text-left text-wrap hyphens-auto truncate">{recipe.title}</h2>
      <div className="flex items-center gap-3 min-h-[25px]">
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Flame size={14} fill="var(--primary)"/>
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
            <div className="flex items-center gap-2">
              <TooltipTrigger asChild>
                <Link 
                  href={`/user/${recipe.creator.id}`}
                  onClick={(e) => e.stopPropagation()}
                  prefetch={false}
                >
                  <Avatar>
                    <AvatarImage 
                      src={recipe.creator.image || defaultProfilePicture}
                      alt={`Profile picture of ${resolvedNickname}`}
                    />
                    <AvatarFallback className="bg-mealicious-primary text-white">
                      {resolvedNickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolvedNickname}</p>
              </TooltipContent>
              <span className="font-semibold text-sm">{resolvedNickname}</span>
            </div>
          </Tooltip>
        )
      }
      <div className="min-h-[25px] flex items-center gap-3 mt-auto">
        <div className="flex-1 flex items-center gap-1.25 rounded-sm">
          <Star size={20} fill="#ffba00" strokeWidth={0}/>
          <span className="font-semibold">{overallRating > 0 ? overallRating.toFixed(1) : "-"}</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex-1 flex items-center gap-1.25 rounded-sm">
          <Heart size={20} fill="#ff637e" strokeWidth={0}/>
          <span className="font-semibold">{recipe.statistics.favoriteCount || "-"}</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex-1 flex items-center gap-1.25 rounded-sm">
          <ArrowDownToLine size={20} stroke="var(--muted-foreground)"/>
          <span className="font-semibold">{recipe.statistics.favoriteCount || "-"}</span>
        </div>
      </div>
      <span className="italic text-muted-foreground text-sm">
        Created {getDateDifference(recipe.createdAt)} ago
      </span>
    </div>
  );
}
