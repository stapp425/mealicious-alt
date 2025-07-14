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
      <div className="empty:hidden flex flex-wrap items-center gap-2">
        {
          recipe.diets.slice(0, 4).map((d) => (
            <div key={d.id} className="bg-mealicious-primary font-semibold text-white text-xs py-1 px-4 rounded-full">
              {d.name}
            </div>
          ))
        }
      </div>
      <div className="flex items-center gap-3 min-h-[25px] mt-auto">
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Flame size={14} fill="var(--primary)"/>
          <span>{Number(recipe.calories).toLocaleString()} Calories</span>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Clock size={14}/>
          <span>{Math.floor(recipe.prepTime)} min</span>
        </div>
      </div>
      <div className="grid gap-0.5">
        {
          !isSameDay(recipe.createdAt, recipe.updatedAt, { in: tz("UTC") }) && (
            <span className="italic text-muted-foreground text-sm">
              Last updated on {format(recipe.updatedAt, "MMM d, yyyy")}
            </span>
          )
        }
        <span className="italic text-muted-foreground text-sm">
          Created on {format(recipe.createdAt, "MMM d, yyyy")}
        </span>
      </div>
    </div>
  );
}
