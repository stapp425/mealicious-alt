"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { parseAsIndex, parseAsString, useQueryState } from "nuqs";

export default function MorePlansSearchBar() {
  const [query, setQuery] = useQueryState("query", parseAsString.withDefault(""));
  const [,setPage] = useQueryState(
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
        placeholder="Search Plan..."
        onKeyUp={(e) => {
          if (e.key !== "Enter") return;
          setPage(0);
        }}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        onClick={() => setPage(0)}
        className="h-9 mealicious-button font-semibold text-sm flex items-center gap-2 px-4 rounded-md"
      >
        Search
        <Search size={16} aria-hidden={undefined}/>
      </button>
    </div>
  );
}
