"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RecipeCreationSchema } from "@/lib/zod";
import { Clock, Info } from "lucide-react";
import { UseFormRegister } from "react-hook-form";
import z from "zod";

type RecipeTimeProps = {
  className?: string,
  register: UseFormRegister<z.infer<typeof RecipeCreationSchema>>,
  recipeTimesDetails: {
    icon: typeof Clock,
    label: string,
    field: "cookTime" | "prepTime" | "readyTime"
    message?: string
  }[]
};

export default function RecipeTimes({ className, recipeTimesDetails, register }: RecipeTimeProps) {
  const errorMessage = recipeTimesDetails.find((rt) => rt.message)?.message;
  
  return (
    <div className={cn("field-container flex flex-col justify-between gap-3", className)}>
      <h1 className="font-bold text-2xl required-field">Times</h1>
      <p className="text-muted-foreground font-semibold">
        Add preparation times for this recipe.
      </p>
      <div className="flex flex-col justify-between gap-3 xl:gap-2">        
        {
          recipeTimesDetails.map((rt, i) => (
            <div
              key={i}
              className="relative flex-1 bg-mealicious-primary flex flex-col items-center gap-3 p-2 rounded-md"
            >
              <h1 className="font-bold text-xl text-white">{rt.label}</h1>
              <div className="flex items-center gap-2 text-white">
                <rt.icon size={28}/>
                <Input
                  type="number"
                  min={0}
                  max={9999.99}
                  step="any"
                  autoComplete="off"
                  className="w-[75px] h-[30px] bg-transparent focus:bg-white focus:text-black"
                  {...register(rt.field)}
                />
                <span className="font-semibold">mins</span>
              </div>
              {
                rt.message && (
                  <div className="error-label m-0 p-2 absolute top-4 right-4">
                    <Info size={18}/>
                  </div>
                )
              }
            </div>
          ))
        }
      </div>
      {
        errorMessage && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errorMessage}
          </div>
        )
      }
    </div>
  );
}