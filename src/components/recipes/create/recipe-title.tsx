"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_RECIPE_TITLE_LENGTH } from "@/lib/zod/recipe";
import { Info } from "lucide-react";
import { useFormState, useWatch } from "react-hook-form";
import { useCreateRecipeFormContext } from "@/components/recipes/create/create-recipe-form";
import { ComponentProps, memo } from "react";

export default function RecipeTitle({ className, ...props }: Omit<ComponentProps<"section">, "children">) {
  const { control, register } = useCreateRecipeFormContext();
  const { 
    errors: {
      title: titleError
    }
  } = useFormState({ control, name: "title" });
  const currentTitle = useWatch({ control, name: "title" });
  
  return (
    <section
      {...props}
      className={cn(
        "@container flex flex-col gap-1.5",
        className
      )}
    >
      <h1 className="required-field font-bold text-2xl">
        Title
      </h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <p className="font-semibold text-muted-foreground text-sm">
          Add a title to your recipe here.
        </p>
        <span className={cn(
          "shrink-0 text-sm",
          currentTitle.length > MAX_RECIPE_TITLE_LENGTH && "text-red-500"
        )}>
          <b className="text-base">{currentTitle.length}</b> / {MAX_RECIPE_TITLE_LENGTH}
        </span>
      </div>
      <div className="error-text text-xs has-[>span:empty]:hidden -mt-1">
        <Info size={14}/>
        <span>{titleError?.message}</span>
      </div>
      <Input
        {...register("title")}
        placeholder="Title"
        className="h-10 rounded-sm shadow-none"
      />
      <PublicStatusCheckbox />
    </section>
  );
}

const PublicStatusCheckbox = memo(({
  id = "isPublic",
  className,
  ...props
}: Omit<ComponentProps<typeof Checkbox>, "children">) => {
  const { control, setValue } = useCreateRecipeFormContext();
  const isPublic = useWatch({ control, name: "isPublic" });

  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={id}
        checked={isPublic}
        onCheckedChange={(val) => setValue(
          "isPublic",
          val === true,
          { shouldDirty: true }
        )}
        className={cn(
          "rounded-xs shadow-none",
          className
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Make Recipe Public
      </label>
    </div>
  );
});

PublicStatusCheckbox.displayName = "PublicStatusCheckbox";
