"use client";

import { Input } from "@/components/ui/input";
import { filters as filtersEnum, sorts } from "@/lib/types";
import { SavedRecipeSearchSchema } from "@/lib/zod/recipe";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { parseAsArrayOf, parseAsIndex, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import SearchOptions from "@/components/recipes/saved/search-options";

export default function SearchBar() {
  const [{
    query,
    sort,
    filters
  }, setParams] = useQueryStates({
    query: parseAsString.withDefault(""),
    page: parseAsIndex.withDefault(0),
    sort: parseAsStringLiteral(sorts),
    filters: parseAsArrayOf(parseAsStringLiteral(filtersEnum)).withDefault([])
  });

  const {
    control,
    register,
    setValue,
    handleSubmit
  } = useForm({
    resolver: zodResolver(SavedRecipeSearchSchema),
    defaultValues: {
      query,
      sort: sort || undefined,
      filters
    }
  });

  const onSubmit = useMemo(() => handleSubmit((data) => {
    setParams({
      query: data.query || null,
      sort: data.sort || null,
      filters: data.filters,
      page: 0
    }, {
      shallow: false,
      throttleMs: 500
    });
  }), [handleSubmit, setParams]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex justify-between items-center gap-3">
        <Input 
          placeholder="Recipe Query"
          {...register("query")}
          className="rounded-sm shadow-none"
        />
        <button
          type="submit"
          className="h-9 mealicious-button font-semibold text-sm flex items-center gap-2 px-4 rounded-sm"
        >
          <span className="hidden @min-2xl:inline">Search</span>
          <Search size={16}/>
        </button>
      </div>
      <SearchOptions 
        control={control}
        setValue={setValue}
      />
    </form>
  );
}
