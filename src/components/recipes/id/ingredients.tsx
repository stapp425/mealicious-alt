"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecipeIngredients } from "@/lib/actions/recipe";
import { units } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { ComponentProps } from "react";

export default function Ingredients({ 
  recipeId,
  count,
  className,
  ...props
}: Omit<ComponentProps<"section">, "children"> & {
  recipeId: string;
  count: number;
}) {
  const { 
    data: ingredients,
    isLoading: ingredientsLoading,
    error: ingredientsError
  } = useQuery({
    queryKey: ["recipe-details", recipeId, { type: "ingredients" }],
    queryFn: () => getRecipeIngredients(recipeId),
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  if (ingredientsError) {
    return (
      <section className="error-label flex items-center gap-2 p-2">
        <Info size={16}/>
        There was an error while fetching ingredients content.
      </section>
    );
  }

  if (ingredientsLoading || !ingredients) {
    return (
      <section className="@container flex flex-col gap-2.5">
        <Skeleton className="w-32 h-8 rounded-sm"/>
        <div className="grid @min-2xl:grid-cols-2 @min-3xl:grid-cols-3 @min-4xl:grid-cols-4 gap-3">
          {
            Array.from({ length: 8 }, (_, i) => i).map((i) => (
              <Skeleton key={i} className="h-18 rounded-sm"/>
            ))
          }
        </div>
      </section>
    );
  }
  
  return (
    <section 
      className={cn(
        "@container flex flex-col gap-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Info size={16} className="cursor-pointer"/>
          </PopoverTrigger>
          <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
            Raw materials that are necessary in making this recipe. You can use the checkbox for each ingredient to track that you are in possession of the ingredient.
          </PopoverContent>
        </Popover>
        <h2 className="font-bold text-xl">Ingredients</h2>
      </div>
      <div className="grid @min-2xl:grid-cols-2 @min-3xl:grid-cols-3 @min-4xl:grid-cols-4 gap-3">
        {
          ingredients.map((i) => {
            const foundUnit = units.find((u) => u.abbreviation === i.unit)!;
            const scaledAmount = Number((i.amount * count).toFixed(2));
            
            return (
              <Label 
                key={i.id}
                className={cn(
                  "cursor-pointer min-h-18 border border-border flex flex-col items-start gap-2 p-4 rounded-sm transition-colors overflow-hidden",
                  "has-data-[state=checked]:border-mealicious-primary has-data-[state=checked]:bg-mealicious-primary/20"
                )}
              >
                <div className="w-full mb-1.5">
                  <Checkbox className="float-left mr-3"/>
                  <h3 className="font-bold text-lg capitalize -my-1.25">{i.name}</h3>
                </div>
                <span className="space-x-1.25">
                  <span className="font-bold text-xl">{scaledAmount.toLocaleString()}</span>
                  <span className="text-base font-light">{scaledAmount !== 1 ? foundUnit.pluralName : foundUnit.name}</span>
                  <span className="font-normal text-xs">({i.unit})</span>
                </span>
                <p className="text-muted-foreground hyphens-auto mt-auto empty:hidden">
                  {i.note}
                </p>
              </Label>
            );
          })
        }
      </div>
    </section>
  );
}
