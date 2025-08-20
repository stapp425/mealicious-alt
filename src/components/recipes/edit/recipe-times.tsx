"use client";

import { Input } from "@/components/ui/input";
import { Clock, Info, Microwave, Clipboard } from "lucide-react";
import { useEditRecipeFormContext } from "./edit-recipe-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFormState } from "react-hook-form";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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

export default function RecipeTimes({ className, ...props }: Omit<ComponentProps<"section">, "children">) {
  const { control, register } = useEditRecipeFormContext();
  const {
    errors: {
      prepTime: prepTimeError,
      cookTime: cookTimeError,
      readyTime: readyTimeError
    }
  } = useFormState({ control, name: ["prepTime", "cookTime", "readyTime"] });
  

  return (
    <section 
      {...props}
      className={cn(
        "@container flex flex-col justify-between gap-1.5",
        className
      )}
    >
      <h1 className="font-bold text-2xl required-field">Times</h1>
      <p className="text-muted-foreground font-semibold text-sm">
        Add preparation times for this recipe.
      </p>
      <div className="flex flex-col @min-xl:flex-row justify-between gap-3">        
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
                  step={1}
                  autoComplete="off"
                  className="w-20 h-8 bg-transparent focus:bg-white focus:text-black rounded-sm shadow-none"
                  {...register(rt.field, { setValueAs: Number })}
                />
                <span className="font-semibold">mins</span>
              </div>
            </div>
          ))
        }
      </div>
      <div className="error-label hidden has-[li:not(:empty)]:flex flex-col gap-2 ">
        <div className="flex items-center gap-2">
          <Info size={14}/>
          <span className="font-bold text-sm">Recipe Time Errors</span>
        </div>
        <Separator className="bg-primary/33 dark:bg-border"/>
        <ul className="flex flex-col gap-1">
          <li className="text-xs list-inside list-disc empty:hidden">
            {prepTimeError?.message}
          </li>
          <li className="text-xs list-inside list-disc empty:hidden">
            {cookTimeError?.message}
          </li>
          <li className="text-xs list-inside list-disc empty:hidden">
            {readyTimeError?.message}
          </li>
        </ul>
      </div>
    </section>
  );
}
