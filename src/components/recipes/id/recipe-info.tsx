"use client";

import { useQueryState, parseAsStringLiteral } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ComponentProps, JSX, useState } from "react";
import { Unit } from "@/lib/types";
import { Info } from "lucide-react";
import Nutrition from "@/components/recipes/id/nutrition";
import Ingredients from "@/components/recipes/id/ingredients";
import Instructions from "@/components/recipes/id/instructions";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

type Tab = {
  label: string;
  Component: (props: Omit<ComponentProps<"section">, "children"> & {
    recipeId: string;
    count: number;
  }) => JSX.Element;
};

const tabs: Tab[] = [
  {
    label: "nutrition",
    Component: Nutrition
  },
  {
    label: "ingredients",
    Component: Ingredients
  },
  {
    label: "instructions",
    Component: Instructions
  }
];

const tabLabels = tabs.map(({ label }) => label);
const MAX_SERVING_SIZE_SCALAR = 100;

export default function RecipeInfo({ 
  queryParameter = "recipeDetailsView",
  recipeId,
  servingSizeAmount,
  servingSizeUnit,
  className,
  ...props
}: Omit<ComponentProps<typeof Tabs>, "children"> & {
  queryParameter?: string;
  recipeId: string;
  servingSizeAmount: number;
  servingSizeUnit: Unit["abbreviation"];
}) {
  const [count, setCount] = useState(1);
  const [view, setView] = useQueryState(queryParameter, 
    parseAsStringLiteral(tabLabels)
      .withDefault(tabLabels[0])
  );
  
  return (
    <Tabs 
      value={view}
      onValueChange={setView}
      className={cn(
        "w-full gap-6 min-h-94 @min-4xl:col-span-2",
        className
      )}
      {...props}
    >
      <TabsList className="bg-accent/67 dark:bg-sidebar w-full min-h-12 p-0 rounded-none">
        {
          tabLabels.map((label) => (
            <TabsTrigger
              key={label}
              value={label}
              className={cn(
                "cursor-pointer rounded-none shadow-none transition-all capitalize",
                "data-[state=active]:pointer-events-none data-[state=active]:shadow-none data-[state=active]:bg-mealicious-primary-muted/67 dark:data-[state=active]:bg-transparent",
                "data-[state=active]:border-b-3 data-[state=active]:border-b-mealicious-primary!"
              )}
            >
              {label}
            </TabsTrigger>
          ))
        }
      </TabsList>
      <div className="border border-border w-full flex flex-col gap-0.25 p-4 rounded-sm">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Info size={16} className="cursor-pointer"/>
            </PopoverTrigger>
            <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
              The amount of a recipe that is generally served.
            </PopoverContent>
          </Popover>
          <h2 className="font-semibold">Serving Size</h2>
        </div>
        <h3 className="font-light">
          <b className="font-bold text-2xl">{Math.round(servingSizeAmount)}</b> {servingSizeUnit}
        </h3>
        <div className="flex justify-between items-center gap-2 -my-1">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Info size={16} className="cursor-pointer"/>
              </PopoverTrigger>
              <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
                How much the serving size is multiplied by. Nutrition and ingredient quantities are calculated accordingly.
              </PopoverContent>
            </Popover>
            <h2 className="font-bold">Serving Size Scalar</h2>
          </div>
          <Input 
            type="number"
            value={count}
            onChange={(e) => setCount(Math.min(Math.max(1, Number(e.target.value)), MAX_SERVING_SIZE_SCALAR))}
            className="w-20 font-semibold border border-border flex bg-sidebar text-center text-sm py-1.5 mb-2 rounded-sm shadow-none"
          />
        </div>
        <Slider
          value={[count]}
          onValueChange={(val) => setCount(val[0])}
          min={1}
          max={MAX_SERVING_SIZE_SCALAR}
          className="my-2"
        />
        <div className="text-sm font-semibold flex justify-between items-center mt-1">
          <h3>1</h3>
          <h3>{MAX_SERVING_SIZE_SCALAR}</h3>
        </div>
      </div>
      {/* Each tab component must retain their state, therefore they shouldn't be unmounted and remounted */}
      {
        tabs.map(({ label, Component }) => (
          <Component 
            key={label}
            recipeId={recipeId}
            count={count}
            className={cn(label !== view && "hidden")}
          />
        ))
      }
    </Tabs>
  );
}
