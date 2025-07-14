"use client";

import { UserRecipesView, userRecipesView } from "@/lib/types";
import { parseAsIndex, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownToLine, Heart, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const viewOptions = [
  {
    value: "created",
    label: "Created",
    icon: Pencil
  },
  {
    value: "saved",
    label: "Saved",
    icon: ArrowDownToLine
  },
  {
    value: "favorited",
    label: "Favorited",
    icon: Heart
  },
];

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
    <>
    <Select
      value={recipesView}
      onValueChange={(val) => setQuery({
        recipesView: val as UserRecipesView,
        page: null
      })}
    >
      <SelectTrigger className="w-full sm:hidden">
        <SelectValue placeholder="Option"/>
      </SelectTrigger>
      <SelectContent>
        {
          viewOptions.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))
        }
      </SelectContent>
    </Select>
    <Tabs
      orientation="vertical"
      value={recipesView}
      onValueChange={(val) => setQuery({
        recipesView: val as UserRecipesView,
        page: null
      })}
      className="hidden sm:inline-flex"
    >
      <TabsList className="min-w-[200px] h-fit bg-transparent p-0 gap-3 rounded-none">
        {
          viewOptions.map((v) => (
            <TabsTrigger
              key={v.value}
              value={v.value}
              className="cursor-pointer w-full justify-start items-center border border-border data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:text-white data-[state=active]:bg-mealicious-primary! data-[state=inactive]:text-muted-foreground py-2 px-4 rounded-sm"
            >
              <v.icon />
              {v.label}
            </TabsTrigger>
          ))
        }
      </TabsList>
    </Tabs>
    </>
  );
}