"use client";

import { UserRecipesView, userRecipesView } from "@/lib/types";
import { parseAsIndex, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownToLine, Heart, Pencil } from "lucide-react";

export default function RecipesOptions() {
  const [{ recipesView }, setQuery] = useQueryStates({
    recipesView: parseAsStringLiteral(userRecipesView)
      .withDefault("created")
      .withOptions({
        clearOnDefault: false
      }),
    page: parseAsIndex.withDefault(0)
  }, {
    shallow: false,
    urlKeys: {
      recipesView: "option"
    }
  });

  return (
    <Tabs
      orientation="vertical"
      value={recipesView}
      onValueChange={(val) => setQuery({
        recipesView: val as UserRecipesView,
        page: null
      })}
    >
      <TabsList className="min-w-[200px] h-fit bg-transparent p-0 gap-3 rounded-none">
        <TabsTrigger
          value="created"
          className="cursor-pointer w-full justify-start items-center border border-border data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:text-white data-[state=active]:bg-mealicious-primary! data-[state=inactive]:text-muted-foreground py-2 px-4 rounded-sm"
        >
          <Pencil />
          Created
        </TabsTrigger>
        <TabsTrigger
          value="saved"
          className="cursor-pointer w-full justify-start items-center border border-border data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:text-white data-[state=active]:bg-mealicious-primary! data-[state=inactive]:text-muted-foreground py-2 px-4 rounded-sm"
        >
          <ArrowDownToLine />
          Saved
        </TabsTrigger>
        <TabsTrigger
          value="favorited"
          className="cursor-pointer w-full justify-start items-center border border-border data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:text-white data-[state=active]:bg-mealicious-primary! data-[state=inactive]:text-muted-foreground py-2 px-4 rounded-sm"
        >
          <Heart />
          Favorited
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}