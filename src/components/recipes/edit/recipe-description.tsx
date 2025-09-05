"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_RECIPE_DESCRIPTION_LENGTH } from "@/lib/zod/recipe";
import { Info } from "lucide-react";
import { useFormState, useWatch } from "react-hook-form";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";
import { ComponentProps } from "react";

export default function RecipeDescription({ 
  className,
  ...props
}: Omit<ComponentProps<"section">, "children">) {
  const { register, control } = useEditRecipeFormContext();
  const currentDescription = useWatch({ control, name: "description" });
  const { 
    errors: { 
      description: descriptionError
    }
  } = useFormState({ control, name: "description" });
  
  return (
    <section 
      {...props}
      className={cn(
        "flex flex-col gap-1.5",
        className
      )}
    >
      <h1 className="text-2xl font-bold">Description</h1>
      <p className="text-muted-foreground text-sm font-semibold">
        Add a brief description about your recipe here. (optional)
      </p>
      <div className="error-text text-xs mb-1 has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{descriptionError?.message}</span>
      </div>
      <Textarea
        {...register("description")}
        spellCheck={false}
        placeholder="Description"
        autoComplete="off"
        className="max-h-32 resize-none hyphens-auto rounded-sm shadow-none"
      />
      <span className={cn(
        "text-sm",
        currentDescription && currentDescription.length > MAX_RECIPE_DESCRIPTION_LENGTH && "text-red-500"
      )}>
        <b className="text-base">{currentDescription?.length || 0}</b> / {MAX_RECIPE_DESCRIPTION_LENGTH}
      </span>
    </section>
  );
}
