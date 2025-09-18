"use client";

import { usePlanCalendarContext } from "@/components/plans/calendar/plan-calendar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { getDetailedPlansInTimeFrame } from "@/lib/actions/plan";
import { cn } from "@/lib/utils";
import { DetailedPlan } from "@/lib/zod/plan";
import { tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { addWeeks, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Flame, Info } from "lucide-react";
import { memo, useMemo } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { mealTypes } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function CalendarWeek() {
  const { userId, date, setDate } = usePlanCalendarContext();
  
  const { weekStart, weekEnd } = useMemo(
    () => ({
      weekStart: startOfWeek(date),
      weekEnd: endOfWeek(date)
    }),
    [date]
  );

  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansErrored
  } = useQuery({
    queryKey: [
      "plan-calendar",
      userId,
      { 
        startDate: weekStart,
        endDate: weekEnd
      },
      { type: "week" },
    ],
    queryFn: () => getDetailedPlansInTimeFrame({
      userId,
      startDate: new UTCDate(weekStart),
      endDate: new UTCDate(weekEnd)
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col @min-2xl:flex-row justify-between items-start @min-2xl:items-end gap-2">
        <h1 className="font-bold text-3xl text-wrap">
          {format(weekStart, "MMM d, yyyy")} - {format(weekEnd, "MMM d, yyyy")}
        </h1>
        <div className="h-9 flex items-center gap-2">
          <Button variant="ghost" className="cursor-pointer" onClick={() => setDate(addWeeks(date, -1))}>
            <ChevronLeft />
            Previous
          </Button>
          <Separator orientation="vertical"/>
          <Button variant="ghost" className="cursor-pointer" onClick={() => setDate(addWeeks(date, 1))}>
            Next
            <ChevronRight />
          </Button>
        </div>
      </div>
      {
        plansErrored && (
          <div className="min-h-8 p-4">
            <div className="error-label flex items-center gap-2 p-2">
              <Info size={16}/>
              There was an error while fetching calendar plans.
            </div>
          </div>
        )
      }
      {
        plansLoading || !plans ? (
          <>
          <Skeleton className="w-50 h-8"/>
          {
            Array.from({ length: 7 }, (_, i) => i).map((i) => (
              <Skeleton key={i} className="w-full h-24"/>
            ))
          }
          </>
        ) : (
          <>
          <div className="flex items-center gap-2 text-sm">
            <Info size={16}/>
            {plans.length > 0 ? `You have ${plans.length} ${plans.length !== 1 ? "plans" : "plan"} on this week.` : "There are no plans on this week."}
          </div>
          {
            eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d) => (
              <CalendarWeekDay
                key={format(d, "MMM d, yyyy")}
                date={d}
                plans={plans.filter((p) => isSameDay(p.date, new UTCDate(d), { in: tz("UTC") }))}
              />
            ))
          }
          </>
        )
      }
    </div>
  );
}

const CalendarWeekDay = memo(({
  date,
  plans
}: {
  date: Date;
  plans: DetailedPlan[];
}) => {
  return (
    <div className="border border-border grid gap-3 p-4 rounded-md">
      <div className="flex items-center gap-3 @min-2xl:gap-4">
        <span className="bg-mealicious-primary w-18 text-white text-center text-sm font-semibold py-1 px-4 rounded-sm">
          {format(date, "E").toUpperCase()}
        </span>
        <h1 className="block @min-2xl:hidden font-bold">{format(date, "MMM d")}</h1>
        <h1 className="hidden @min-2xl:block font-bold text-lg">{format(date, "MMMM d, yyyy")}</h1>
        {
          (plans.length > 0 && !open) && (
            <>
            <div className="hidden @min-2xl:block bg-mealicious-primary text-xs text-white font-semibold py-1 px-3 rounded-full">
              {plans.length} {plans.length !== 1 ? "plans" : "plan"}
            </div>
            <div className="flex @min-2xl:hidden justify-center items-center bg-mealicious-primary text-xs text-white font-semibold py-1 px-3 aspect-square rounded-full">
              {plans.length}
            </div>
            </>
          )
        }
      </div>
      {
        plans.length > 0 && plans.map((p) => (
          <Collapsible key={p.id} asChild>
            <div className="grid gap-2 transition-all mt-1.5">
              <div className="overflow-hidden grid grid-cols-[1fr_auto] items-start gap-6">
                <h2 className="font-bold text-2xl hyphens-auto line-clamp-2 @min-2xl:line-clamp-1">{p.title}</h2>
                <CollapsibleTrigger className="[&[data-state=open]_svg]:rotate-180" asChild>
                  <Button className="ml-auto cursor-pointer flex gap-2 items-center" variant="secondary">
                    <ChevronDown className="transition-all"/>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="flex flex-wrap gap-2.5 empty:hidden">
                {
                  p.tags.map((t) => (
                    <div 
                      key={t}
                      className="bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3"
                    >
                      {t}
                    </div>
                  ))
                }
              </div>
              <p className={cn(
                p.description ? "line-clamp-1" : "italic",
                "text-muted-foreground group-disabled:text-secondary"
              )}>
                {p.description || "No description is available."}
              </p>
              <CollapsibleContent className="flex flex-col gap-3 @min-2xl:gap-0">
                {
                  p.meals.sort((a, b) => mealTypes.indexOf(a.type) - mealTypes.indexOf(b.type)).map((m) => (
                    <div
                      key={`${m.id}-${m.type}`}
                      className="w-full flex gap-4 rounded-sm"
                    >
                      <div key={m.id} className="w-full text-left flex flex-col @min-2xl:flex-row items-start gap-4">
                        <span className="min-w-24 bg-mealicious-primary text-white text-xs text-center font-semibold py-1.5 rounded-sm capitalize">
                          {m.type}
                        </span>
                        <Separator orientation="vertical" className="hidden @min-2xl:block"/>
                        <div className="flex-1 grid gap-3 @min-2xl:mb-4.5">
                          <h2 className="font-bold line-clamp-2">{m.title}</h2>
                          <div className="grid gap-2.5">
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
        ))
      }
    </div>
  );
});

CalendarWeekDay.displayName = "CalendarWeekDay";
