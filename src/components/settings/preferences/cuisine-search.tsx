"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { usePagination } from "@/hooks/use-pagination";
import { getCuisines, getCuisinesCount } from "@/lib/actions/settings";
import { cn, MAX_CUISINE_RESULT_DISPLAY_LIMIT } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import React, { memo, useCallback, useEffect, useState, useTransition } from "react";
import { useWatch } from "react-hook-form";
import { useDebounce } from "use-debounce";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useChangeCuisinePreferencesFormContext } from "@/components/settings/preferences/change-cuisine-preferences-form";

type Cuisine = {
  id: string;
  icon: string;
  adjective: string;
  description: string;
};

export default function CuisineSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  
  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      setQuery("");
    }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mealicious-button flex justify-center items-center text-white text-sm font-semibold py-2 px-4 rounded-sm"
        >
          Add
        </button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>
              Recipe Search
            </DialogTitle>
            <DialogDescription>
              Search for cuisines to add as a preference.
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        <div className="grid">
          <CuisineSearchInput 
            query={query}
            setQuery={setQuery}
          />
          <Separator />
          <CuisineSearchResults query={debouncedQuery}/>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type CuisineSearchInputProps = {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
};

const CuisineSearchInput = memo(({ query, setQuery }: CuisineSearchInputProps) => {
  return (
    <div className="text-muted-foreground flex justify-between items-center py-2 px-4">
      <Input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Cuisine..."
        className="border-none bg-transparent! focus-visible:ring-0 p-0 shadow-none"
      />
      <DialogClose asChild>
        <X
          strokeWidth={1.25}
          className="cursor-pointer"
        />
      </DialogClose>
    </div>
  );
});

CuisineSearchInput.displayName = "CuisineSearchInput";

type CuisineSearchResultsProps = {
  query: string;
};

const CuisineSearchResults = memo(({ query }: CuisineSearchResultsProps) => {
  const { control, append } = useChangeCuisinePreferencesFormContext();
  const formCuisineValues = useWatch({ control, name: "preferences" });
  const [pending, startTransition] = useTransition();
  const [cuisineResults, setCuisineResults] = useState<{ cuisines: Cuisine[], count: number }>({
    cuisines: [],
    count: 0
  });
  const { 
    currentPage,
    isFirstPage,
    isLastPage,
    setToPage,
    incrementPage,
    decrementPage,
    list: paginationList
  } = usePagination({
    totalPages: Math.ceil(cuisineResults.count / MAX_CUISINE_RESULT_DISPLAY_LIMIT)
  });
  
  const fetchCuisineResults = useCallback((query: string, currentPage: number) => startTransition(async () => {
    const [[{ count }], cuisines] = await Promise.all([
      getCuisinesCount(query),
      getCuisines({
        query,
        limit: MAX_CUISINE_RESULT_DISPLAY_LIMIT,
        offset: currentPage * MAX_CUISINE_RESULT_DISPLAY_LIMIT
      })
    ]);

    setCuisineResults({ cuisines, count });
  }), [startTransition, setCuisineResults]);

  useEffect(
    () => fetchCuisineResults(query, currentPage),
    [query, currentPage]
  );
  
  return (
    <div className="flex flex-col gap-2 p-4 overflow-x-hidden">
      {
        pending ? (
          <div className="min-h-[50px] flex justify-center items-center">
            <Loader2 className="animate-spin m-auto my-3"/>
          </div>
        ) : (
          <>
          {
            cuisineResults.cuisines.length > 0 ? (
              <>
              <h2 className="text-base sm:text-lg font-bold">Cuisine Results ({cuisineResults.count})</h2>
              <Separator />
              <ul className="grid gap-6">
                {
                  cuisineResults.cuisines.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        disabled={formCuisineValues.some((f) => f.id === c.id)}
                        onClick={() => {
                          append({ ...c, score: 1 });
                          toast.success("Cuisine successfully added!");
                        }}
                        className="group/cuisine cursor-pointer disabled:cursor-not-allowed text-left w-full flex items-center gap-4 rounded-sm"
                      >
                        <div className="relative shrink-0 size-12">
                          <Image 
                            src={c.icon}
                            alt={`Origin of ${c.adjective} cuisine`}
                            fill
                            className="rounded-sm object-cover object-center group-disabled/cuisine:opacity-25"
                          />
                        </div>
                        <div>
                          <h2 className="font-semibold line-clamp-1 group-disabled/cuisine:text-secondary">{c.adjective}</h2>
                          <p className="line-clamp-2 text-muted-foreground text-sm group-disabled/cuisine:text-muted">{c.description}</p>
                        </div>
                      </button>
                    </li>
                  ))
                }
              </ul>
            <div className="flex items-end h-10 gap-3 mx-auto mt-4">
              <Button
                variant="ghost"
                disabled={isFirstPage}
                onClick={decrementPage}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft />
              </Button>
              {
                paginationList.map((p, i) => p === "..." ? (
                  <span key={i} className="text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setToPage(p - 1)}
                    disabled={p - 1 === currentPage}
                    className={cn(
                      p - 1 === currentPage ? "border-mealicious-primary bg-mealicious-primary text-white" : "border-muted-foreground text-muted-foreground",
                      "border cursor-pointer disabled:cursor-not-allowed text-sm h-full flex justify-center items-center min-w-6 font-semibold px-3 rounded-sm transition-colors"
                    )}
                  >
                    {p}
                  </button>
                ))
              }
              <Button
                variant="ghost"
                disabled={isLastPage}
                onClick={incrementPage}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight />
              </Button>
            </div>
              </>
            ) : (
              <h1 className="text-center font-bold text-lg text-muted-foreground py-8">No cuisine found.</h1>
            )
          }
          </>
        )
      }
    </div>
  );
});

CuisineSearchResults.displayName = "CuisineSearchResults";
