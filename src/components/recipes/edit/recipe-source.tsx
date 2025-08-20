"use client";

import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";
import { useFormState } from "react-hook-form";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export default function RecipeSource({ className, ...props }: Omit<ComponentProps<"section">, "children">) {
  const { control, register } = useEditRecipeFormContext();
  const { 
    errors: {
      source: sourceError
    }
  } = useFormState({ control, name: ["source.name", "source.url"] });
  
  return (
    <section 
      {...props}
      className={cn(
        "flex flex-col gap-2",
        className
      )}
    >
      <h1 className="text-2xl font-bold">Source</h1>
      <p className="text-muted-foreground font-semibold text-sm">
        Add a source name and URL if this recipe comes from an external source. (optional)
      </p>
      <div className="error-text has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{sourceError?.name?.message}</span>
      </div>
      <Input 
        {...register("source.name")}
        placeholder="Source Name (optional)"
        className="rounded-sm shadow-none"
      />
      <div className="error-text has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{sourceError?.url?.message}</span>
      </div>
      <Input 
        {...register("source.url")}
        placeholder="Source URL (optional)"
        className="rounded-sm shadow-none"
      />
      <div className="error-text has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{sourceError?.message}</span>
      </div>
    </section>
  );
}
