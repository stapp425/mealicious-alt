"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecipeNutrition } from "@/lib/actions/recipe";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { ComponentProps } from "react";

export default function Nutrition({ 
  count,
  recipeId,
  className,
  ...props
}: Omit<ComponentProps<"section">, "children"> & {
  count: number;
  recipeId: string;
}) {
  const { 
    data: nutrition,
    isLoading: nutritionLoading,
    error: nutritionError
  } = useQuery({
    queryKey: ["recipe-details", recipeId, { type: "nutrition" }],
    queryFn: () => getRecipeNutrition(recipeId),
    gcTime: 1000 * 60 * 5, // 5 minutes,
    refetchOnWindowFocus: false
  });

  if (nutritionError) {
    return (
      <section className="error-label flex items-center gap-2 p-2">
        <Info size={16}/>
        There was an error while fetching nutrition content.
      </section>
    );
  }
  
  if (nutritionLoading || !nutrition) {
    return (
      <section className="flex flex-col gap-2">
        <Skeleton className="w-32 h-10 rounded-sm"/>
        <div className="font-bold flex justify-between items-center gap-2">
          <Skeleton className="w-26 h-8 rounded-sm"/>
          <Skeleton className="w-24 h-8 rounded-sm"/>
        </div>
        <div className="grid gap-2">
          {
            Array.from({ length: 4 }, (_, i) => i).map((i) => (
              <Skeleton key={i} className="h-12 rounded-sm"/>
            ))
          }
        </div>
      </section>
    );
  }
  
  return (
    <section 
      className={cn(
        "flex flex-col gap-2",
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
            Substances found in food that provide supplementary energy.
          </PopoverContent>
        </Popover>
        <h2 className="font-bold text-xl">Nutrition</h2>
      </div>
      <div className="font-bold flex justify-between items-center gap-2">
        <h2>Nutrient</h2>
        <h2>Amount</h2>
      </div>
      <div className="grid">
        {
          nutrition.map((n) => (
            <div 
              key={n.id}
              className="flex justify-between items-center gap-2 odd:bg-border dark:odd:bg-muted py-3 px-4 rounded-sm"
            >
              <h3>{n.name}</h3>
              <p>{(Math.round(n.amount) * count).toLocaleString()} {n.unit}</p>
            </div>
          ))
        }
      </div>
    </section>
  );
}
