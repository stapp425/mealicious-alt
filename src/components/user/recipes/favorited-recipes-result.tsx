"use client";

import { getNickname } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, Flame } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import defaultProfilePicture from "@/img/default/default-pfp.svg";

type FavoritedRecipesResultProps = {
  recipe: {
    id: string;
    title: string;
    image: string;
    prepTime: number;
    calories: number;
    diets: {
      id: string;
      name: string;
    }[];
    creator: {
      id: string;
      nickname: string | null;
      email: string;
      image: string | null;
    } | null;
  };
};

export default function FavoritedRecipesResult({ recipe }: FavoritedRecipesResultProps) {
  const { push } = useRouter();
  const resolvedNickname = recipe.creator ? getNickname({ nickname: recipe.creator.nickname, email: recipe.creator.email }) : "[deleted]";
  
  return (
    <div 
      onClick={() => push(`/recipes/${recipe.id}`)}
      className="cursor-pointer h-full flex flex-col gap-3 bg-sidebar border border-border overflow-hidden p-4 rounded-md transition-colors"
    >
      <div className="relative h-[150px]">
        <Image 
          src={recipe.image}
          alt={`Image of ${recipe.title}`}
          fill
          className="object-cover object-center rounded-sm"
        />
      </div>
      <h2 className="font-bold text-lg">{recipe.title}</h2>
      {
        recipe.diets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {
              recipe.diets.slice(0, 4).map((d) => (
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
          <span>{recipe.calories.toLocaleString()} Calories</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Clock size={14}/>
          <span>{recipe.prepTime} min</span>
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
    </div>
  );
}
