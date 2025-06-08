"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recipeDetailViews } from "@/lib/types";
import { Info, Search, Square } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

type DietsProps = {
  diets: {
    name: string;
    id: string;
    description: string | null;
  }[];
};

export default function Diets({ diets }: DietsProps) {
  const [view, setView] = useQueryState(
    "dietsView",
    parseAsStringLiteral(recipeDetailViews)
      .withDefault("simplified")
  );
  
  return (
    <Tabs
      value={view}
      onValueChange={(val) => setView(val as "simplified" | "detailed")}
    >
      <section className="overflow-hidden bg-sidebar border border-border flex flex-col rounded-md">
        <div className="flex justify-between items-center gap-2 py-2 px-3">
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">Diets</h2>
                <Info size={16} className="cursor-pointer"/>
              </div>
            </PopoverTrigger>
            <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
              A curated selection of foods and drinks with similar nutritional qualities.
            </PopoverContent>
          </Popover>
          <TabsList className="bg-transparent gap-2">
            <TabsTrigger
              value="simplified"
              className="cursor-pointer border-border data-[state=active]:border-none data-[state=active]:cursor-default data-[state=active]:bg-mealicious-primary data-[state=active]:text-white dark:data-[state=active]:bg-mealicious-primary data-[state=inactive]:hover:bg-secondary transition-colors p-4"
            >
              <Square />
              <span className="hidden md:inline">Simplified</span>
            </TabsTrigger>
            <TabsTrigger
              value="detailed"
              className="cursor-pointer border-border data-[state=active]:border-none data-[state=active]:cursor-default data-[state=active]:bg-mealicious-primary data-[state=active]:text-white dark:data-[state=active]:bg-mealicious-primary data-[state=inactive]:hover:bg-secondary transition-colors p-4"
            >
              <Search />
              <span className="hidden md:inline">Detailed</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <Separator />
        <TabsContent value="simplified" asChild>
          <div className="flex flex-wrap gap-2 p-3">
            {
              diets.map((d) => (
                <Badge key={d.id} className="bg-mealicious-primary text-white px-3 rounded-full">
                  {d.name}
                </Badge>
              ))
            }
          </div>
        </TabsContent>
        <TabsContent value="detailed" asChild>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 p-3">
            {
              diets.map((d) => (
                <div
                  key={d.id}
                  className="bg-mealicious-primary text-white flex flex-col gap-2 p-3 rounded-md"
                >
                  <h2 className="font-bold text-lg">{d.name}</h2>
                  <Separator />
                  <p>{d.description}</p>
                </div>
              ))
            }
          </div>
        </TabsContent>
      </section>
    </Tabs>
  );
}
