"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recipeDetailViews } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Info, Search, Square } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { ComponentProps } from "react";

export default function DishTypes({
  dishTypes,
  className,
  ...props
}: ComponentProps<"section"> & {
  dishTypes: {
    name: string;
    id: string;
    description: string;
  }[];
}) {
  const [view, setView] = useQueryState(
    "dishTypesView",
    parseAsStringLiteral(recipeDetailViews)
      .withDefault("simplified")
  );
  
  return (
    <Tabs
      value={view}
      onValueChange={(val) => setView(val as "simplified" | "detailed")}
    >
      <section 
        className={cn(
          "@container dark:bg-sidebar overflow-hidden border border-border flex flex-col rounded-md",
          className
        )}
        {...props}
      >
        <div className="flex justify-between items-center gap-2 py-2 px-3">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Info size={16} className="cursor-pointer"/>
              </PopoverTrigger>
              <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
                How a specific recipe is identified as part of a meal and what time of day they are typically eaten at.
              </PopoverContent>
            </Popover>
            <h2 className="font-bold text-lg mt-0.5">Dish Types</h2>
          </div>
          <TabsList className="bg-transparent gap-2 p-0">
            <TabsTrigger
              value="simplified"
              className={cn(
                "cursor-pointer border-border flex items-center gap-1.5 transition-colors py-2.5! px-3.5!",
                "data-[state=active]:border-none data-[state=active]:pointer-events-none data-[state=active]:text-white",
                "data-[state=active]:bg-mealicious-primary dark:data-[state=active]:bg-mealicious-primary",
                "data-[state=inactive]:hover:bg-secondary"
              )}
            >
              <Square size={14}/>
              <span className="hidden @min-sm:inline text-xs">Simplified</span>
            </TabsTrigger>
            <TabsTrigger
              value="detailed"
              className={cn(
                "cursor-pointer border-border flex items-center gap-1.5 transition-colors py-2.5! px-3.5!",
                "data-[state=active]:border-none data-[state=active]:pointer-events-none data-[state=active]:text-white",
                "data-[state=active]:bg-mealicious-primary dark:data-[state=active]:bg-mealicious-primary",
                "data-[state=inactive]:hover:bg-secondary"
              )}
            >
              <Search size={14}/>
              <span className="hidden @min-sm:inline text-xs">Detailed</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <Separator />
        <TabsContent value="simplified" asChild>
          <div className="flex flex-wrap gap-2 p-3">
            {
              dishTypes.map((dt) => (
                <div 
                  key={dt.id}
                  className="flex-1 only:flex-none font-semibold only:w-1/2 text-center text-nowrap text-sm bg-mealicious-primary text-white py-2 px-3 rounded-sm"
                >
                  {dt.name}
                </div>
              ))
            }
          </div>
        </TabsContent>
        <TabsContent value="detailed" asChild>
          <div className="grid @min-2xl:grid-cols-2 gap-2 p-3">
            {
              dishTypes.map((dt) => (
                <div
                  key={dt.id}
                  className="bg-mealicious-primary text-white flex flex-col gap-2 p-3 rounded-md"
                >
                  <h2 className="font-bold">{dt.name}</h2>
                  <Separator />
                  <p className="text-sm">{dt.description}</p>
                </div>
              ))
            }
          </div>
        </TabsContent>
      </section>
    </Tabs>
  );
}
