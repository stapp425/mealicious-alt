"use client";

import { cn, MAX_CUISINE_RESULT_DISPLAY_LIMIT } from "@/lib/utils";
import { ChangeCuisinePreferencesFormSchema, MAX_CUISINE_SCORE, type ChangeCuisinePreferencesForm } from "@/lib/zod/settings";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Info, Loader2, LoaderCircle, Trash2, X } from "lucide-react";
import Image from "next/image";
import { createContext, memo, useContext, useMemo, useState } from "react";
import { Control, useFieldArray, UseFieldArrayAppend, UseFieldArrayRemove, useForm, UseFormSetValue, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getCuisines, getCuisinesCount, updateCuisinePreferences } from "@/lib/actions/settings";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { usePagination } from "@/hooks/use-pagination";

type ChangeCuisinePreferencesFormProps = {
  cuisinePreferences: {
    id: string;
    icon: string;
    adjective: string;
    description: string;
    score: number;
  }[];
};

type ChangeCuisinePreferencesFormContextProps<T extends ChangeCuisinePreferencesForm = ChangeCuisinePreferencesForm> = {
  control: Control<T>;
  append: UseFieldArrayAppend<T>;
  remove: UseFieldArrayRemove;
};

const ChangeCuisinePreferencesFormContext = createContext<ChangeCuisinePreferencesFormContextProps | null>(null);

export function useChangeCuisinePreferencesFormContext() {
  const context = useContext(ChangeCuisinePreferencesFormContext);
  if (!context) throw new Error("useChangeCuisinePreferencesFormContext can only be used within a ChangeCuisinePreferencesFormContext.");
  return context;
}

export default function ChangeCuisinePreferencesForm({ cuisinePreferences }: ChangeCuisinePreferencesFormProps) {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: {
      isDirty
    }
  } = useForm({
    resolver: zodResolver(ChangeCuisinePreferencesFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { preferences: cuisinePreferences }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "preferences" });

  const { execute, isExecuting } = useAction(updateCuisinePreferences, {
    onSuccess: async ({ data, input }) => {
      await queryClient.invalidateQueries({
        queryKey: ["search-recipes-results"]
      });
      reset(input);
      toast.success(data.message);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const providerProps = useMemo(
    () => ({
      control,
      append,
      remove
    }),
    [control, append, remove]
  );
  
  return (
    <ChangeCuisinePreferencesFormContext value={providerProps}>
      <form onSubmit={handleSubmit(execute)} className="grid overflow-hidden">
        <h1 className="font-bold text-xl">Cuisine Preferences</h1>
        <p className="text-muted-foreground mb-1">Change your cuisine preferences here.</p>
        <div className="text-muted-foreground flex items-center gap-2">
          <Info size={16}/>
          <p className="text-muted-foreground font-light text-sm">These preferences can be applied when you search for new recipes.</p>
        </div>
        <div className="border border-border mt-4 rounded-md overflow-hidden">
          <div className="peer/cuisines grid empty:hidden">
            {
              fields.map((f, index) => (
                <CuisinePreference 
                  key={f.id}
                  index={index}
                  setPreferenceValue={setValue}
                />
              ))
            }
          </div>
          <div className="min-h-36 font-bold text-muted-foreground text-lg text-center hidden peer-empty/cuisines:flex flex-col justify-center items-center">
            No cuisine preferences found.
          </div>
          <div className="border-t border-t-border flex items-center gap-3 p-3">
            <CuisineSearch />
            <button
              type="submit"
              disabled={isExecuting}
              className={cn("mealicious-button w-20 flex justify-center items-center text-white text-sm font-semibold py-2 px-4 rounded-sm", !isDirty && "hidden")}
            >
              {isExecuting ? <LoaderCircle size={18} className="animate-spin"/> : "Submit"}
            </button>
            <Button
              type="button"
              variant="destructive"
              disabled={isExecuting}
              onClick={() => reset()}
              className={cn("cursor-pointer rounded-sm", !isDirty && "hidden")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </ChangeCuisinePreferencesFormContext>
  );
}

const CuisinePreference = memo(({
  index,
  setPreferenceValue
}: {
  index: number;
  setPreferenceValue: UseFormSetValue<ChangeCuisinePreferencesForm>;
}) => {
  const { control, remove } = useChangeCuisinePreferencesFormContext();
  
  const cuisinePreference = useWatch({
    control,
    name: `preferences.${index}`
  });

  return (
    <div className="grid gap-4 not-first:border-t not-first:border-t-border p-4">
      <div className="flex items-center gap-3">
        <Image 
          src={cuisinePreference.icon}
          alt={`Origin of ${cuisinePreference} cuisine`}
          width={32}
          height={32}
          className="object-cover object-center rounded-full"
        />
        <h2 className="font-semibold text-lg">{cuisinePreference.adjective}</h2>
        <Button
          type="button"
          variant="destructive"
          onClick={() => remove(index)}
          className="cursor-pointer size-8 ml-auto rounded-sm"
        >
          <Trash2 />
        </Button>
      </div>
      <RadioGroup 
        value={String(cuisinePreference.score)}
        onValueChange={(val) => setPreferenceValue(`preferences.${index}.score`, Number(val), { shouldDirty: true })}
        className="flex justify-between gap-2 sm:gap-3"
      >
        {
          Array.from({ length: MAX_CUISINE_SCORE }, (_, i) => String(i + 1)).map((i) => (
            <Label 
              key={i}
              className={cn(
                "flex-1 cursor-pointer border border-muted-foreground/25 flex flex-col @min-2xl:flex-row justify-around items-center gap-2 rounded-sm py-2 px-3",
                "has-data-[state=checked]:pointer-events-none has-data-[state=checked]:border-mealicious-primary has-data-[state=checked]:bg-mealicious-primary/20"
              )}
            >
              <RadioGroupItem value={i} className="peer/radio-item"/>
              <span className="text-muted-foreground peer-data-[state=checked]/radio-item:text-primary">{i}</span>
            </Label>
          ))
        }
      </RadioGroup>
    </div>
  );
});

CuisinePreference.displayName = "CuisinePreference";

const CuisineSearch = memo(() => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  
  return (
    <Dialog 
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        setQuery("");
      }}
    >
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
          <Separator />
          <CuisineSearchResults query={debouncedQuery}/>
        </div>
      </DialogContent>
    </Dialog>
  );
});

CuisineSearch.displayName = "CuisineSearch";

const CuisineSearchResults = memo(({ query }: { query: string; }) => {
  const { control, append } = useChangeCuisinePreferencesFormContext();
  const formCuisineValues = useWatch({ control, name: "preferences" });

  const {
    data: cuisineResultsCount,
    isLoading: cuisineResultsCountLoading,
    isError: cuisineResultsCountErrored
  } = useQuery({
    queryKey: ["cuisine-preferences-search-results", query, { type: "count" }],
    queryFn: () => getCuisinesCount(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
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
    totalPages: Math.ceil((cuisineResultsCount ?? 0) / MAX_CUISINE_RESULT_DISPLAY_LIMIT)
  });
  
  const {
    data: cuisineResults,
    isLoading: cuisineResultsLoading,
    isError: cuisineResultsErrored
  } = useQuery({
    queryKey: ["cuisine-preferences-search-results", query, currentPage],
    queryFn: () => getCuisines({
      query,
      limit: MAX_CUISINE_RESULT_DISPLAY_LIMIT,
      offset: currentPage * MAX_CUISINE_RESULT_DISPLAY_LIMIT
    }),
    enabled: typeof cuisineResultsCount !== "undefined",
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  if (cuisineResultsCountErrored || cuisineResultsErrored) {
    return (
      <div className="min-h-8 p-4">
        <div className="error-label flex items-center gap-2 p-2">
          <Info size={16}/>
          There was an error while fetching recipes content.
        </div>
      </div>
    );
  }

  if (cuisineResultsCountLoading || typeof cuisineResultsCount === "undefined" || cuisineResultsLoading || !cuisineResults) {
    return (
      <div className="min-h-12 flex justify-center items-center">
        <Loader2 className="animate-spin m-auto my-3"/>
      </div>
    );
  }

  if (cuisineResultsCount <= 0 || cuisineResults.length <= 0) {
    return (
      <div className="min-h-12">
        <h1 className="text-center font-bold text-lg text-muted-foreground m-auto py-8">No cuisine found.</h1>
      </div>
    );
  }
  
  return (
    <div className="grid gap-2 p-4 overflow-x-hidden">
      <h2 className="text-base sm:text-lg font-bold">Cuisine Results ({cuisineResultsCount})</h2>
      <Separator />
      <ul className="grid gap-6">
        {
          cuisineResults.map((c) => (
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
      <div className="flex items-end h-10 gap-3 mx-auto">
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
                p - 1 === currentPage ? "border-mealicious-primary bg-mealicious-primary text-white" : "border-secondary-foreground text-secondary-foreground",
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
    </div>
  );
});

CuisineSearchResults.displayName = "CuisineSearchResults";
