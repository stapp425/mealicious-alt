"use client";

import { Separator } from "@/components/ui/separator";
import { tz } from "@date-fns/tz";
import { format, isSameDay } from "date-fns";
import { Clock, Flame } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type CreatedRecipesResultProps = {
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
    createdAt: Date;
    updatedAt: Date;
  };
};

export default function CreatedRecipesResult({ recipe }: CreatedRecipesResultProps) {
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
        !isSameDay(recipe.createdAt, recipe.updatedAt, { in: tz("UTC") }) && (
          <span className="text-muted-foreground text-sm">
            Last updated on {format(recipe.updatedAt, "MMM d, yyyy")}
          </span>
        )
      }
      <span className="text-muted-foreground text-sm">
        Created on {format(recipe.createdAt, "MMM d, yyyy")}
      </span>
    </div>
  );
}
