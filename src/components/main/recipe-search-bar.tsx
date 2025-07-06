"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ArrowRight, Clock, Loader2, Search, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState, useTransition } from "react"
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { nanoid } from "nanoid";
import { getRecentSearchesData, searchForRecipesQueryIndices } from "@/lib/actions/algolia";
import { addRecentSearchData, removeRecentSearchData } from "@/lib/functions/algolia";

export default function RecipeSearchBar() {
  const { push } = useRouter();
  const [touched, setTouched] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [indices, setIndices] = useState<{ title: string; objectID: string; }[]>([]);
  const [recentSearches, setRecentSearches] = useState<{ id: string; label: string; category?: string }[]>([]);
  const [isPending, startTransition] = useTransition();
  const fetchNewIndices = useDebouncedCallback(() => startTransition(async () => {
    if (query) {
      setTouched(true);
      const hits = await searchForRecipesQueryIndices(query);
      setIndices(hits);
    } else {
      setIndices([]);
      setTouched(false);
    }
  }), 500);

  const addToRecentSearches = useCallback(async ({ id, label, isQuery = false }: { id: string; label: string; isQuery?: boolean; }) => {
    const foundDuplicateRecentSearch = recentSearches.find((rs) => isQuery ? rs.label === query : rs.id === id);

    if (foundDuplicateRecentSearch)
      removeRecentSearchData(foundDuplicateRecentSearch.id);

    if (addRecentSearchData({ id, label, isQuery })) {
      const updatedData = await getRecentSearchesData();
      
      push(isQuery ? `/recipes/search?query=${query}` : `/recipes/${id}`);
      setOpen(false);
      setTimeout(() => {
        setRecentSearches(updatedData);
        setQuery("");
      }, 500);
    } else {
      toast.error("Failed to insert to recent searches.");
    }
  }, [recentSearches]);

  useEffect(() => {
    fetchNewIndices();
  }, [query]);

  useEffect(() => {
    getRecentSearchesData()
      .then((data) => setRecentSearches(data));
  }, []);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mealicious-button font-semibold text-sm flex items-center gap-3 rounded-full py-2 px-5">
          Quick Recipe Search
          <Search size={16}/>
        </button>
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
          <div className="text-muted-foreground flex justify-between items-center py-2 px-4">
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Recipe..."
              className="border-none bg-transparent! focus-visible:ring-0 p-0 shadow-none"
            />
            <X
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              strokeWidth={1.25}
              className="cursor-pointer"
            />
          </div>
          <Separator />
          {
            query && (
              <div className="flex flex-col gap-3 p-4">
                {
                  isPending ? (
                    <div className="min-h-[50px] flex justify-center items-center">
                      <Loader2 className="animate-spin m-auto my-3"/>
                    </div>
                  ) : (
                    touched && (
                      <>
                      {
                        indices.length > 0 && (
                          <>
                          <h2 className="font-bold text-lg">Search Results</h2>
                          <ul className="flex flex-col gap-3">
                            {
                              indices.map((i) => (
                                <li key={i.objectID}>
                                  <button
                                    onClick={async () => await addToRecentSearches({
                                      id: i.objectID,
                                      label: i.title
                                    })}
                                    className="mealicious-button text-left w-full font-semibold flex items-center gap-4 py-2.5 px-3 transition-colors rounded-sm"
                                  >
                                    <Search size={14}/>
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold truncate max-w-[200px] sm:max-w-[375px]">{i.title}</span>
                                      <span className="font-semibold text-sm text-slate-200 hidden sm:block">Recipe</span>
                                    </div>
                                    <ArrowRight size={16} className="ml-auto"/>
                                  </button>
                                </li>
                              ))
                            }
                          </ul>
                          </>
                        )
                      }
                      </>
                    )
                  )
                }
                {
                  query && (
                    <button
                      onClick={async () => await addToRecentSearches({
                        id: nanoid(),
                        label: query,
                        isQuery: true
                      })}
                      className="cursor-pointer flex items-center gap-3 hover:underline mt-1"
                    >
                      <Search size={14}/>
                      <h1 className="font-semibold text-sm">Search for &quot;{query}&quot;</h1>
                    </button>
                  )
                }
              </div>
            )
          }
          {
            recentSearches.length > 0 && (
              <>
              <Separator />
              <div className="p-4">
                <h1 className="font-bold text-lg mb-3">Recent Searches</h1>
                <ul className="flex flex-col gap-3">
                  {
                    recentSearches.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={s.category === "query" ? `/recipes/search?query=${s.label}` : `/recipes/${s.id}`}
                          onClick={() => setOpen(false)}
                          className="border border-border bg-sidebar cursor-pointer hover:bg-muted text-left w-full truncate flex items-center gap-4 p-3 transition-colors rounded-sm"
                        >
                          <Clock stroke="var(--muted-foreground)" size={24}/>
                          <div className="flex flex-col items-start">
                            <span className="font-semibold truncate max-w-[200px] sm:max-w-[375px]">{s.label}</span>
                            <span className="font-semibold text-sm text-muted-foreground hidden sm:block">{s.category ? "Query" : "Recipe"}</span>
                          </div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (removeRecentSearchData(s.id))
                                setRecentSearches((rs) => rs.filter((fs) => fs.id !== s.id));
                              else
                                toast.error("Failed to remove from recent searches.");
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
              </div>
              </>
            )
          }
          {
            indices.length === 0 && recentSearches.length === 0 && !touched && !isPending && !query && (
              <div className="min-h-[100px] flex justify-center items-center p-4">
                <h2 className="text-center text-muted-foreground text-lg font-semibold">No recent searches</h2>
              </div>
            )
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}
