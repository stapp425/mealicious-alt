"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sort, sorts, View, views } from "@/lib/types";
import { LayoutGrid, List } from "lucide-react";
import { parseAsIndex, parseAsStringLiteral, useQueryStates } from "nuqs";

export default function ResultOptions() {
  const [resultOptions, setResultOptions] = useQueryStates({
    view: parseAsStringLiteral(views).withDefault("list"),
    page: parseAsIndex.withDefault(0),
    sort: parseAsStringLiteral(sorts).withDefault("none")
  }, {
    shallow: false
  });

  const { view, sort } = resultOptions;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">View</h2>
        <h2 className="font-semibold">Sort Options</h2>
      </div>
      <div className="flex items-center gap-2">
        <Tabs
          value={view}
          onValueChange={(val) => setResultOptions((r) => ({ 
            ...r,
            view: val as View,
            page: 0
          }))}
        >
          <TabsList className="bg-transparent gap-2">
            <TabsTrigger
              value="list"
              className="cursor-pointer border-border data-[state=active]:border-none data-[state=active]:cursor-default data-[state=active]:bg-mealicious-primary data-[state=active]:text-white dark:data-[state=active]:bg-mealicious-primary data-[state=inactive]:hover:bg-secondary transition-colors p-4"
            >
              <List />
              <span className="hidden md:inline">List</span>
            </TabsTrigger>
            <TabsTrigger
              value="grid"
              className="cursor-pointer border-border data-[state=active]:border-none data-[state=active]:cursor-default data-[state=active]:bg-mealicious-primary data-[state=active]:text-white dark:data-[state=active]:bg-mealicious-primary data-[state=inactive]:hover:bg-secondary transition-colors p-4"
            >
              <LayoutGrid />
              <span className="hidden md:inline">Grid</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 ml-auto">
          {
            sort !== "none" && (
              <Button 
                variant="destructive"
                onClick={() => setResultOptions((r) => ({ 
                  ...r,
                  sort: "none",
                  page: 0
                }))}
                className="cursor-pointer"
              >
                Clear
              </Button>
            )
          }
          <Select value={sort || undefined} onValueChange={(val) => setResultOptions((r) => ({
            ...r,
            sort: val as Sort,
            page: 0
          }))}>
            <SelectTrigger className="w-[125px]">
              <SelectValue placeholder="Sort by..."/>
            </SelectTrigger>
            <SelectContent>
              {
                sorts.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.split(/\W/).map((str) => str.charAt(0).toUpperCase() + str.slice(1)).join(" ")}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}