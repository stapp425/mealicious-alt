"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_RECIPE_DESCRIPTION_LENGTH } from "@/lib/zod/recipe";
import { Info } from "lucide-react";
import { useFormState, useWatch } from "react-hook-form";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";

export default function RecipeDescription() {
  const { register, control } = useEditRecipeFormContext();
  const currentDescription = useWatch({ control, name: "description" });
  const { 
    errors: { 
      description: descriptionError
    }
  } = useFormState({ control, name: "description" });
  
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Description</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <p className="text-muted-foreground font-semibold">
          Add a brief description about your recipe here. (optional)
        </p>
        <span className={cn(currentDescription && currentDescription.length > MAX_RECIPE_DESCRIPTION_LENGTH && "text-red-500", "shrink-0")}>
          <b className="text-xl">{currentDescription?.length || 0}</b> / {MAX_RECIPE_DESCRIPTION_LENGTH}
        </span>
      </div>
      <Textarea
        {...register("description")}
        spellCheck={false}
        placeholder="Enter a recipe description here..."
        autoComplete="off"
        className="min-h-[100px] hyphens-auto flex-1 flex rounded-md"
      />
      {
        descriptionError?.message &&
        <div className="error-text text-sm">
          <Info size={16}/>
          {descriptionError?.message}
        </div> 
      }
    </div>
  );
}
