"use client";

import { Input } from "@/components/ui/input";
import { Clock, Info, Microwave, Clipboard } from "lucide-react";
import { useEditRecipeFormContext } from "./edit-recipe-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFormState } from "react-hook-form";

const recipeTimesDetails = [
  {
    icon: Clock,
    label: "Prep Time",
    tip: "The estimated time for the necessary ingredients to be prepared.",
    field: "prepTime" as const
  },
  {
    icon: Microwave,
    label: "Cook Time",
    tip: "The estimated time it takes for a recipe to be cooked to perfection.",
    field: "cookTime" as const
  },
  {
    icon: Clipboard,
    label: "Ready Time",
    tip: "The estimated time the recipe must settle before it is ready to be served.",
    field: "readyTime" as const
  }
];

export default function RecipeTimes() {
  const { control, register } = useEditRecipeFormContext();
  const {
    errors: {
      prepTime: prepTimeError,
      cookTime: cookTimeError,
      readyTime: readyTimeError
    }
  } = useFormState({ control, name: ["prepTime", "cookTime", "readyTime"] });
  
  return (
    <div className="flex flex-col justify-between gap-3">
      <h1 className="font-bold text-2xl required-field">Times</h1>
      <p className="text-muted-foreground font-semibold">
        Add preparation times for this recipe.
      </p>
      <div className="flex flex-col sm:flex-row justify-between gap-3 xl:gap-2">        
        {
          recipeTimesDetails.map((rt, i) => (
            <div
              key={i}
              className="relative flex-1 bg-mealicious-primary flex text-white flex-col items-center gap-3 p-3 rounded-md"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-xl text-white">{rt.label}</h1>
                    <Info size={16} className="cursor-pointer"/>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start" side="top">
                  {rt.tip}
                </PopoverContent>
              </Popover>
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
        prepTimeError?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {prepTimeError.message}
          </div>
        )
      }
      {
        cookTimeError?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {cookTimeError.message}
          </div>
        )
      }
      {
        readyTimeError?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {readyTimeError.message}
          </div>
        )
      }
    </div>
  );
}
