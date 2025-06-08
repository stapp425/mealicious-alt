"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { parseAsIndex, parseAsString, useQueryState } from "nuqs";

export default function SearchBar() {
  const [query, setQuery] = useQueryState("query", parseAsString.withDefault(""));
  const [_, setPage] = useQueryState(
    "page",
    parseAsIndex
      .withDefault(0)
      .withOptions({
        shallow: false
      })
  );

  return (
    <div className="flex justify-between items-center gap-3">
      <Input 
        value={query}
        placeholder="Search Recipe..."
        onKeyUp={(e) => {
          if (e.key !== "Enter") return;
          setPage(0);
        }}
        onChange={(e) => {
          const { value } = e.target;
          setQuery(value);
        }}
      />
      <button
        onClick={() => setPage(0)}
        className="h-9 mealicious-button font-semibold text-sm flex items-center gap-2 px-4 rounded-md"
      >
        Search
        <Search size={16}/>
      </button>
    </div>
  );
}