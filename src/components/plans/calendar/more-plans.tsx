"use client";

import { deletePlan, getDetailedPlansInTimeFrame, getPlansInTimeFrameCount } from "@/lib/actions/plan";
import { mealTypes, morePlansTimeFrame, MorePlansTimeFrame, morePlansView, MorePlansView } from "@/lib/types";
import { cn, MAX_PLAN_DISPLAY_LIMIT } from "@/lib/utils";;
import { tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { addMilliseconds, addMonths, addWeeks, addYears, format, startOfDay } from "date-fns";
import { Calendar, ChevronDown, EllipsisVertical, Flame, Info, Loader2, Pencil, Search, SearchX, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { parseAsIndex, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/plans/calendar/pagination";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { DetailedPlan } from "@/lib/zod/plan";
import Link from "next/link";
import Image from "next/image";

const inUtc = { in: tz("UTC") };

function useMorePlansOptions() {
  return useQueryStates({
    query: parseAsString.withDefault(""),
    view: parseAsStringLiteral(morePlansView).withDefault("upcoming"),
    timeframe: parseAsStringLiteral(morePlansTimeFrame),
    page: parseAsIndex.withDefault(0)
  }, {
    urlKeys: {
      view: "mode"
    }
  });
}

export default function MorePlans() {
  const [
    {
      timeframe,
      view,
      query,
      page
    },
    setOptions
  ] = useMorePlansOptions();
  
  return (
    <div className="grid gap-2 mt-6">
      <h2 className="font-bold text-4xl capitalize mb-2">{view} Plans</h2>
      <MorePlansSearchBar initialQueryValue={query}/>
      <div className="grid gap-1.5">
        <h2 className="font-bold text-xl">Result Options</h2>
        <div className="flex items-center gap-2 mb-3">
          <Select value={view} onValueChange={(val: MorePlansView) => setOptions({ view: val, page: 0 })}>
            <SelectTrigger className="capitalize rounded-sm shadow-none">
              <SelectValue placeholder="Select a mode"/>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {
                  morePlansView.map((v) => (
                    <SelectItem key={v} value={v} className="capitalize">
                      {v}
                    </SelectItem>
                  ))
                }
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={timeframe || ""} onValueChange={(val: MorePlansTimeFrame) => setOptions({ timeframe: val, page: 0 })}>
            <SelectTrigger className="capitalize rounded-sm shadow-none">
              <SelectValue placeholder="Select a timeframe"/>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {
                  morePlansTimeFrame.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))
                }
              </SelectGroup>
            </SelectContent>
          </Select>
          {
            timeframe && (
              <Button 
                variant="destructive"
                onClick={() => setOptions((o) => ({ 
                  ...o,
                  timeframe: null,
                  page: 0
                }))}
                className="cursor-pointer"
              >
                Clear
              </Button>
            )
          }
        </div>
        <MorePlansSearchResults
          query={query}
          view={view}
          timeframe={timeframe}
          page={page}
        />
      </div>
    </div>
  );
}

const MorePlansSearchBar = memo(({ initialQueryValue }: { initialQueryValue: string; }) => {
  const [query, setQuery] = useState(initialQueryValue);
  const [,setOptions] = useMorePlansOptions();

  return (
    <div className="flex justify-between items-center gap-3">
      <Input 
        value={query}
        placeholder="Plan Query"
        onKeyUp={(e) => {
          if (e.key !== "Enter") return;
          setOptions({ query, page: 0 });
        }}
        onChange={(e) => setQuery(e.target.value)}
        className="rounded-sm shadow-none"
      />
      <button
        onClick={() => setOptions({ query, page: 0 })}
        className="h-9 mealicious-button font-semibold text-sm flex items-center gap-2 px-4 rounded-sm"
      >
        <span className="hidden @min-2xl:inline">Search</span>
        <Search size={16} aria-hidden={undefined}/>
      </button>
    </div>
  );
});

MorePlansSearchBar.displayName = "MorePlansSearchBar";

const MorePlansSearchResults = memo(({
  query,
  view,
  timeframe,
  page
}: {
  query: string;
  view: MorePlansView;
  timeframe: MorePlansTimeFrame | null;
  page: number;
}) => {
  const { data } = useSession();
  const userId = data?.user?.id;
  
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const startOfDayNow = startOfDay(now, inUtc);
    let date1: Date | null = null;
    let date2: Date | null = null;
    
    if (timeframe) {
      if (view === "upcoming") {
        date1 = startOfDayNow;
        switch (timeframe) {
          case "week":
          date2 = addWeeks(date1, 1, inUtc);
          break;
        case "month":
          date2 = addMonths(date1, 1, inUtc);
          break;
        case "year":
          date2 = addYears(date1, 1, inUtc);
          break;
        }
      } else {
        date2 = startOfDayNow;
        switch (timeframe) {
          case "week":
          date1 = addWeeks(date2, -1, inUtc);
          break;
        case "month":
          date1 = addMonths(date2, -1, inUtc);
          break;
        case "year":
          date1 = addYears(date2, -1, inUtc);
          break;
        }
      }
    } else {
      if (view === "upcoming") date1 = startOfDayNow;
      else date2 = startOfDayNow;
    }

    return {
      startDate: date1,
      endDate: date2 ? new UTCDate(addMilliseconds(date2, -1, inUtc)) : undefined,
    };
  }, [timeframe, view]);
  
  const {
    data: plansCount,
    isLoading: plansCountLoading,
    isError: plansCountErrored
  } = useQuery({
    queryKey: [
      "more-plans",
      { type: "count" },
      userId,
      query,
      { startDate, endDate }
    ],
    queryFn: () => getPlansInTimeFrameCount({
      userId: userId as string,
      query,
      startDate: startDate ? new UTCDate(startDate) : undefined,
      endDate: endDate ? new UTCDate(addMilliseconds(endDate, -1, inUtc)) : undefined,
    }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansErrored
  } = useQuery({
    queryKey: [
      "more-plans",
      userId,
      query,
      { startDate, endDate },
      page
    ],
    queryFn: () => getDetailedPlansInTimeFrame({
      userId: userId as string,
      query,
      startDate: startDate ? new UTCDate(startDate) : undefined,
      endDate: endDate ? new UTCDate(addMilliseconds(endDate, -1, inUtc)) : undefined,
      limit: MAX_PLAN_DISPLAY_LIMIT,
      offset: page * MAX_PLAN_DISPLAY_LIMIT
    }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  if (plansCountErrored || plansErrored) {
    return (
      <div className="min-h-8 p-4">
        <div className="error-label flex items-center gap-2 p-2">
          <Info size={16}/>
          There was an error while fetching {view} plans content.
        </div>
      </div>
    );
  }

  if (plansCountLoading || plansLoading || typeof plansCount === "undefined" || !plans) {
    return (
      <div className="grid gap-2">
        <Skeleton className="w-48 h-8"/>
        <div className="flex flex-wrap gap-2.5">
          {
            Array.from({ length: 5 }, (_, i) => (i)).map((i) => (
              <Skeleton key={i} className="w-24 h-6 rounded-full py-1 px-3"/>
            ))
          }
        </div>
        <Skeleton className="w-full h-6"/>
        <div className="flex flex-col gap-3 @min-2xl:gap-0">
          {
            Array.from({ length: 3 }, (_, i) => i).map((i) => (
              <div key={i} className="w-full flex gap-4 rounded-sm">
                <div className="w-full text-left flex flex-col @min-2xl:flex-row items-start gap-4">
                  <div className="w-24 flex flex-col gap-2.5 shrink-0 @min-2xl:pb-4.5">
                    <Skeleton className="w-4/5 h-6"/>
                    <Skeleton className="w-full h-6"/>
                  </div>
                  <div className="w-full flex-1 flex flex-col items-start gap-3 @min-2xl:pb-4.5">
                    <Skeleton className="w-38 h-6"/>
                    <div className="w-full flex flex-col start gap-2.5">
                      {
                        Array.from({ length: 3 }, (_, i) => i).map((i) => (
                          <Skeleton key={i} className="w-full h-25"/>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {
        plans.length > 0 ? (
          <div className="flex flex-col gap-3">
            {
              plans.map((p) => (
                <MorePlansResult 
                  key={p.id}
                  plan={p}
                  view={view}
                />
              ))
            }
          </div>
        ) : (
          <div className="bg-sidebar border border-border w-full flex flex-col justify-center items-center gap-6 py-10 px-8 rounded-md">
            <SearchX size={60} className="stroke-muted-foreground"/>
            <div className="flex flex-col items-center gap-2">
              <h3 className="font-bold text-lg mt-auto">No Plan Found!</h3>
              <span className="font-semibold text-center text-muted-foreground">Try making another search or start creating one!</span>
            </div>
          </div>
        )
      }
      <Pagination totalPages={Math.ceil(plansCount / MAX_PLAN_DISPLAY_LIMIT)}/>
    </div>
  );
});

MorePlansSearchResults.displayName = "MorePlansSearchResults";

const MorePlansResult = memo(({
  view,
  plan
}: {
  view: MorePlansView;
  plan: DetailedPlan;
}) => {
  const queryClient = useQueryClient();
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const { execute, isExecuting } = useAction(deletePlan, {
    onSuccess: async ({ data }) => {
      setAlertDialogOpen(false);
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => 
          typeof queryKey[0] === "string" && 
          ["plan-form-calendar-plans", "plan-calendar", "daily-plan", "more-plans"].includes(queryKey[0])
      });
      toast.warning(data.message);
    },
    onError: () => toast.error("Failed to delete plan.")
  });

  return (
    <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen} asChild>
      <div className="border border-border dark:bg-sidebar grid gap-2 p-4 rounded-md transition-all">
        <div className="line-clamp-2 flex justify-between items-start gap-3">
          <h2 className="font-bold text-2xl line-clamp-2 @min-2xl:line-clamp-1 -mb-1">{plan.title}</h2>
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer" asChild>
              <Button variant="ghost" className="size-6 rounded-full p-1.5">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/plans/${plan.id}/edit`}
                  className="cursor-pointer"
                >
                  Edit
                  <Pencil size={16}/>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                  <AlertDialogTrigger className="hover:bg-accent cursor-pointer w-full flex justify-between items-center text-sm px-2 py-1.5 rounded-sm">
                    Delete
                    <Trash2 size={16} className="text-muted-foreground"/>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deleting this plan is an irreversible action! The meals contained in this plan will still remain in the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                      <Button
                        onClick={() => execute({ planId: plan.id })}
                        disabled={isExecuting}
                        variant="destructive"
                        className="min-w-18 cursor-pointer"
                      >
                        {isExecuting ? <Loader2 className="animate-spin"/> : "Continue"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-semibold mb-1.5">
          <Calendar size={16}/>
          <span className="text-sm mt-0.5">{format(plan.date, "MMMM do, yyyy", inUtc)}</span>
        </div>
        <div className="flex flex-wrap gap-x-1.5 gap-y-2 empty:hidden">
          {
            plan.tags.map((t) => (
              <div 
                key={t}
                className={cn(
                  view === "past" && "grayscale",
                  "bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3"
                )}
              >
                {t}
              </div>
            ))
          }
        </div>
        <p className={cn(
          !plan.description && "italic",
          "max-w-full text-muted-foreground group-disabled:text-secondary hyphens-auto line-clamp-5"
        )}>
          {plan.description || "No description is available."}
        </p>
        <CollapsibleTrigger className="[&[data-state=open]_svg]:rotate-180" asChild>
          <Button className="cursor-pointer w-fit flex gap-2 px-4! items-center" variant="secondary">
            {collapsibleOpen ? "Hide Meal Details" : "Show Meal Details"}
            <ChevronDown className="transition-all"/>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3 @min-2xl:gap-0 mt-2.5">
          {
            plan.meals.sort((a, b) => mealTypes.indexOf(a.type) - mealTypes.indexOf(b.type)).map((m) => (
              <div
                key={`${m.id}-${m.type}`}
                className="w-full flex gap-4 rounded-sm"
              >
                <div key={m.id} className="w-full text-left flex flex-col @min-2xl:flex-row items-start gap-4">
                  <span className={cn(
                    view === "past" && "grayscale",
                    "capitalize min-w-24 bg-mealicious-primary text-white text-xs text-center font-semibold py-1.5 rounded-sm"
                  )}>
                    {m.type}
                  </span>
                  <Separator orientation="vertical" className="hidden @min-2xl:block"/>
                  <div className="w-full flex-1 flex flex-col items-start gap-3 @min-2xl:pb-4.5">
                    <h2 className="font-bold line-clamp-2">{m.title}</h2>
                    <div className="w-full flex flex-col start gap-2.5">
                      {
                        m.recipes.map((r) => (
                          <Link 
                            key={r.id}
                            href={`/recipes/${r.id}`}
                            prefetch={false}
                            className="cursor-pointer border border-border grid @min-2xl:grid-cols-[8rem_1fr] gap-4 p-3 rounded-sm"
                          >
                            <div className="relative w-full @min-2xl:w-32 h-36 @min-2xl:h-auto shrink-0">
                              <Image 
                                src={r.image}
                                alt={`Image of ${r.title}`}
                                fill
                                className="object-cover object-center rounded-sm"
                              />
                            </div>
                            <div className="overflow-hidden flex flex-col gap-2">
                              <h2 className="font-bold line-clamp-1">{r.title}</h2>
                              <div className="text-muted-foreground font-semibold text-xs flex items-center gap-1">
                                <Flame size={14} className="fill-muted-foreground"/>
                                {Number(r.calories).toLocaleString()} Calories
                              </div>
                              <p className={cn(
                                r.description ? "line-clamp-1" : "italic",
                                "text-muted-foreground group-disabled:text-secondary"
                              )}>
                                {r.description || "No description is available."}
                              </p>
                            </div>
                          </Link>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

MorePlansResult.displayName = "MorePlansResult";
