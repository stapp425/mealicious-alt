"use client";

import { Input } from "@/components/ui/input";
import { RecipeCreation } from "@/lib/zod";
import { Clock, Info, Microwave, Clipboard } from "lucide-react";
import { useFormContext } from "react-hook-form";

type RecipeTimeDetail = {
  icon: typeof Clock;
  label: string;
  field: "prepTime" | "cookTime" | "readyTime";
};

const recipeTimesDetails: RecipeTimeDetail[] = [
  {
    icon: Clock,
    label: "Prep Time",
    field: "prepTime"
  },
  {
    icon: Microwave,
    label: "Cook Time",
    field: "cookTime"
  },
  {
    icon: Clipboard,
    label: "Ready Time",
    field: "readyTime"
  }
];

export default function RecipeTimes() {
  const {
    register,
    formState: { errors }
  } = useFormContext<RecipeCreation>();
  
  return (
    <div className="field-container flex flex-col justify-between gap-3">
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
            </div>
          ))
        }
      </div>
      {
        errors.prepTime?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errors.prepTime.message}
          </div>
        )
      }
      {
        errors.cookTime?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errors.cookTime.message}
          </div>
        )
      }
      {
        errors.readyTime?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errors.readyTime.message}
          </div>
        )
      }
    </div>
  );
}
