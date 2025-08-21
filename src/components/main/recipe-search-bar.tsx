"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ArrowRight, Clock, Loader2, Search, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ComponentProps, memo, useCallback, useMemo, useRef, useState } from "react"
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { RecentRecipeSearch, RecipeSearchIndex } from "@/lib/zod/recipe";
import Link from "next/link";
import { useLocalStorage } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { searchForRecipesQueryIndices } from "@/lib/actions/algolia";

const MAX_RECENT_RECIPE_SEARCH_AMOUNT = 4;

export default function RecipeSearchBar({
  className,
  onClick,
  mode = "dialog",
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  mode?: "dialog" | "popover";
}) {
  const [touched, setTouched] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  const searchInput = useRef<HTMLInputElement>(null);

  const setSearchQuery = useCallback((query: string) => {
    setQuery(query);
    setTouched(!!query);
  }, [setQuery, setTouched]);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setTouched(false);
  }, [setOpen, setQuery, setTouched]);
  
  if (mode === "dialog") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div 
            {...props}
            onClick={onClick}
            className={cn(
              "mealicious-button size-10 [&>svg]:shrink-0 font-semibold text-sm flex justify-center items-center gap-3 py-2 px-5 rounded-full",
              className
            )}
          >
            <Search size={16}/>
          </div>
        </DialogTrigger>
        <DialogContent className="p-0 gap-0 overflow-hidden" asChild>
          <div className="flex flex-col">
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>
                  Recipe Search
                </DialogTitle>
                <DialogDescription>
                  Search for Mealicious recipes that you know and love.
                </DialogDescription>
              </DialogHeader>
            </VisuallyHidden>
            <div className="text-muted-foreground flex justify-between items-center gap-2 py-2 px-4 rounded-sm">
              <Input
                value={query}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Recipe"
                className="border-none bg-transparent! focus-visible:ring-0 p-0 shadow-none"
              />
              <X
                onClick={closeSearch}
                strokeWidth={1.25}
                className="cursor-pointer"
              />
            </div>
            <Separator />
            <RecipeSearchBody 
              query={query}
              touched={touched}
              close={closeSearch}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <div
          onClick={(e) => {
            if (open) e.preventDefault();
            onClick?.(e);
          }}
          className={cn(
            "border border-input w-[40vw] max-w-125 h-9 text-muted-foreground flex justify-between items-center gap-2 p-2 rounded-sm",
            className
          )}
          {...props}
        >
          <Search size={16}/>
          <Input
            ref={searchInput}
            value={query}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search Recipe"
            className="border-none bg-transparent! focus-visible:ring-0 p-0 shadow-none"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="bg-background w-[40vw] max-w-125 p-0 gap-0 overflow-hidden"
      >
        <RecipeSearchBody 
          query={query}
          touched={touched}
          close={closeSearch}
        />
      </PopoverContent>
    </Popover>
  );
}

const RecipeSearchBody = memo(({
  touched,
  query,
  close
}: {
  touched: boolean;
  query: string;
  close: () => void;
}) => {
  const { push } = useRouter();
  const input = useMemo(() => ({ query, touched }), [query, touched]);
  const [{ query: debouncedQuery, touched: debouncedTouched }] = useDebounce(input, 500);

  const [recentSearches, setRecentSearches] = useLocalStorage<RecentRecipeSearch[]>("recent-recipe-searches", []);

  const {
    data: searchResults,
    isLoading: searchResultsLoading
  } = useQuery({
    queryKey: ["quick-recipe-search-results", debouncedQuery, debouncedTouched],
    queryFn: () => debouncedTouched ? searchForRecipesQueryIndices(debouncedQuery) : [],
    staleTime: 1000 * 120 // 2 minutes
  });

  const addToRecentSearches = useCallback(({
    objectID,
    title,
    isQuery = false
  }: RecipeSearchIndex & { isQuery?: boolean }) => {
    let updatedRecentSearches = recentSearches;

    const foundDuplicateRecentSearch = recentSearches.find((rs) => isQuery ? rs.label === title : rs.id === objectID);
    if (foundDuplicateRecentSearch)
      updatedRecentSearches = updatedRecentSearches.filter((s) => s.id !== foundDuplicateRecentSearch.id);

    const addedRecentSearch = {
      id: objectID,
      label: title,
      category: isQuery ? "query" : undefined
    };

    updatedRecentSearches.unshift(addedRecentSearch);

    if (recentSearches.length > MAX_RECENT_RECIPE_SEARCH_AMOUNT)
      updatedRecentSearches = updatedRecentSearches.slice(0, MAX_RECENT_RECIPE_SEARCH_AMOUNT);
    
    close();
    push(isQuery ? `/recipes/search?query=${debouncedQuery}` : `/recipes/${objectID}`);
    setRecentSearches(updatedRecentSearches);
  }, [recentSearches, debouncedQuery, close, push, setRecentSearches]);

  const removeFromRecentSearches = useCallback((objectID: string) => {
    setRecentSearches((search) => search.filter((s) => s.id !== objectID));
  }, [recentSearches, setRecentSearches]);

  if (searchResultsLoading) {
    return (
      <div className="min-h-[50px] flex justify-center items-center">
        <Loader2 className="animate-spin m-auto my-3"/>
      </div>
    );
  }

  if (touched && searchResults) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {searchResults.length > 0 && <h2 className="font-bold text-lg">Search Results</h2>}
        <RecipeSearchResults
          searchResults={searchResults}
          onResultClick={addToRecentSearches}
        />
        <button
          onClick={() => addToRecentSearches({
            objectID: nanoid(),
            title: query,
            isQuery: true
          })}
          className="cursor-pointer flex items-start gap-3 hover:underline [&>svg]:shrink-0"
        >
          <Search size={14}/>
          <h1 className="font-semibold text-sm text-left -mt-1 line-clamp-3">Search for &quot;{query}&quot;</h1>
        </button>
      </div>
    );
  }

  if (recentSearches && recentSearches.length > 0) {
    return (
      <div className="p-4 [&>ul:empty]:hidden">
        <h1 className="font-bold text-lg mb-3">Recent Searches</h1>
        <RecentRecipeSearches
          recentSearches={recentSearches}
          onRecentSearchClick={({ id, label, category }) => addToRecentSearches({ objectID: id, title: label, isQuery: !!category })}
          removeRecentSearchData={removeFromRecentSearches}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100px] flex justify-center items-center p-4">
      <h2 className="text-center text-muted-foreground text-lg font-semibold">No recent searches</h2>
    </div>
  );
});

RecipeSearchBody.displayName = "RecipeSearchBody";

const RecipeSearchResults = memo(({
  searchResults,
  onResultClick,
  className,
  ...props
}: Omit<React.ComponentProps<"ul">, "children"> & {
  searchResults: RecipeSearchIndex[];
  onResultClick?: (result: RecipeSearchIndex) => void;
}) => {
  return (
    <ul
      className={cn(
        "flex flex-col gap-3 empty:hidden",
        className
      )}
      {...props}
    >
      {
        searchResults.map((r) => (
          <li key={r.objectID}>
            <button
              onClick={() => onResultClick?.({
                objectID: r.objectID,
                title: r.title
              })}
              className="mealicious-button text-left w-full font-semibold flex items-center gap-4 py-2.5 px-3 transition-colors rounded-sm"
            >
              <Search size={14}/>
              <div className="flex flex-col items-start">
                <span className="font-semibold truncate max-w-[200px] sm:max-w-[375px]">{r.title}</span>
                <span className="font-semibold text-sm text-slate-100 dark:text-secondary-foreground hidden sm:block">Recipe</span>
              </div>
              <ArrowRight size={16} className="ml-auto"/>
            </button>
          </li>
        ))
      }
    </ul>
  );
});

RecipeSearchResults.displayName = "RecipeSearchResults";

const RecentRecipeSearches = memo(({
  recentSearches,
  onRecentSearchClick,
  removeRecentSearchData
}: {
  recentSearches: RecentRecipeSearch[];
  onRecentSearchClick?: (recentSearch: RecentRecipeSearch) => void;
  removeRecentSearchData: (objectID: string) => void;
}) => {
  return (
    <ul className="flex flex-col gap-3">
      {
        recentSearches.map((s) => (
          <li key={s.id}>
            <Link
              href={s.category === "query" ? `/recipes/search?query=${s.label}` : `/recipes/${s.id}`}
              onClick={() => onRecentSearchClick?.(s)}
              className="border border-border bg-sidebar cursor-pointer hover:bg-muted text-left w-full truncate flex items-center gap-4 p-3 transition-colors rounded-sm"
            >
              <Clock stroke="var(--muted-foreground)" size={24}/>
              <div className="flex flex-col items-start">
                <span className="font-semibold truncate max-w-[200px] sm:max-w-[375px]">{s.label}</span>
                <span className="font-semibold text-sm text-muted-foreground hidden sm:block">{s.category ? "Query" : "Recipe"}</span>
              </div>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeRecentSearchData(s.id);
                }}
                className="cursor-pointer flex justify-center items-center ml-auto rounded-full transition-colors"
              >
                <X stroke="var(--muted-foreground)" strokeWidth={1.5}/>
              </div>
            </Link>
          </li>
        ))
      }
    </ul>
  );
});

RecentRecipeSearches.displayName = "RecentRecipeSearches";
