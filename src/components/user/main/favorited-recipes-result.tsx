"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, Flame } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";

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
      name: string;
      email: string;
      image: string | null;
    } | null;
  };
};

export default function FavoritedRecipesResult({ recipe }: FavoritedRecipesResultProps) {
  const { push } = useRouter();
    
  return (
    <div 
      onClick={() => push(`/recipes/${recipe.id}`)}
      className="cursor-pointer h-full flex flex-col gap-2.5 dark:bg-sidebar border border-border overflow-hidden p-4 rounded-md transition-colors"
    >
      <div className="relative h-48">
        <Image 
          src={recipe.image}
          alt={`Image of ${recipe.title}`}
          fill
          className="object-cover object-center rounded-sm"
        />
      </div>
      <h2 className="font-bold line-clamp-2 hyphens-auto text-lg -mb-1 overflow-hidden">{recipe.title}</h2>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 empty:hidden">
        {
          recipe.diets.map((d) => (
            <div key={d.id} className="bg-mealicious-primary font-semibold text-white text-xs truncate max-w-full py-1 px-3 rounded-full">
              {d.name}
            </div>
          ))
        }
      </div>
      <div className="flex items-center gap-3 h-6 mt-auto">
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
          <div
            onClick={(e) => {
              e.stopPropagation();
              push(`/user/${recipe.creator?.id}`)
            }} 
            className="group/user cursor-pointer flex items-center gap-3"
          >
            <div className="relative size-8 rounded-full overflow-hidden">
              <Image
                src={recipe.creator.image || defaultProfilePicture}
                alt={`Profile picture of ${recipe.creator.name}`}
                fill
                className="object-cover object-center bg-slate-100"
              />
            </div>
            <span className="group-hover/user:underline font-semibold text-sm">{recipe.creator.name}</span>
          </div>
        )
      }
    </div>
  );
}
