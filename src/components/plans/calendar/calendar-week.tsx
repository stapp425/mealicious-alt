"use client";

import { usePlanCalendarContext } from "@/components/plans/calendar/plan-calendar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { getDetailedPlansInTimeFrame } from "@/lib/actions/plan";
import { cn } from "@/lib/utils";
import { DetailedPlan } from "@/lib/zod";
import { tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { addWeeks, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Flame, Info } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { mealTypes } from "@/lib/types";

export default function CalendarWeek() {
  const { date, setDate } = usePlanCalendarContext();
  const { data } = useSession();
  const [isPending, startTransition] = useTransition();
  const [plans, setPlans] = useState<DetailedPlan[]>([]);
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  
  useEffect(() => {
    if (!data?.user?.id) return;
    const userId = data.user.id;
    startTransition(async () => {
      const utc = tz("UTC");
      const result = await getDetailedPlansInTimeFrame({
        userId,
        startDate: new UTCDate(startOfWeek(date, { in: utc })),
        endDate: new UTCDate(endOfWeek(date, { in: utc }))
      });
      setPlans(result);
    });
  }, [data?.user?.id, date.toISOString()]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <h1 className="font-bold text-3xl text-wrap">
          {format(weekStart, "MMM d, yyyy")} - {format(weekEnd, "MMM d, yyyy")}
        </h1>
        <div className="h-[35px] flex items-center gap-2">
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
        isPending ? (
          <>
          <Skeleton className="w-50 h-8"/>
          {
            Array.from({ length: 7 }, (_, i) => i).map((i) => (
              <Skeleton key={i} className="w-full h-[100px]"/>
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

type CalendarWeekDayProps = {
  date: Date;
  plans: DetailedPlan[];
};

function CalendarWeekDay({ date, plans }: CalendarWeekDayProps) {
  return (
    <div className="border border-border flex flex-col gap-3 p-4 rounded-md">
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="bg-mealicious-primary w-[75px] text-white text-center font-semibold py-1 px-4 rounded-sm">
          {format(date, "E").toUpperCase()}
        </span>
        <h1 className="block sm:hidden font-bold text-xl">{format(date, "MMM d")}</h1>
        <h1 className="hidden sm:block font-bold text-2xl">{format(date, "MMMM d, yyyy")}</h1>
        {
          (plans.length > 0 && !open) && (
            <>
            <div className="hidden sm:block bg-mealicious-primary text-xs text-white font-semibold py-1 px-3 rounded-full">
              {plans.length} {plans.length !== 1 ? "plans" : "plan"}
            </div>
            <div className="flex sm:hidden justify-center items-center bg-mealicious-primary text-xs text-white font-semibold py-1 px-3 aspect-square rounded-full">
              {plans.length}
            </div>
            </>
          )
        }
      </div>
      {
        plans.length > 0 && plans.map((p) => (
          <Collapsible key={p.id} asChild>
            <div className="flex flex-col gap-2 transition-all">
              <Separator />
              <div className="flex justify-between items-center gap-2">
                <h2 className="font-bold text-2xl">{p.title}</h2>
                <CollapsibleTrigger className="[&[data-state=open]_svg]:rotate-180" asChild>
                  <Button className="ml-auto cursor-pointer flex gap-2 items-center" variant="secondary">
                    <ChevronDown className="transition-all"/>
                  </Button>
                </CollapsibleTrigger>
              </div>
              {
                p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2.5">
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
                )
              }
              <p className={cn(
                p.description ? "line-clamp-1" : "italic",
                "text-muted-foreground group-disabled:text-secondary"
              )}>
                {p.description || "No description is available."}
              </p>
              <CollapsibleContent className="flex flex-col gap-3 sm:gap-0">
                {
                  p.meals.sort((a, b) => mealTypes.indexOf(a.type) - mealTypes.indexOf(b.type)).map((m) => (
                    <div
                      key={`${m.id}-${m.type}`}
                      className="w-full flex gap-4 rounded-sm"
                    >
                      <div key={m.id} className="w-full text-left flex flex-col sm:flex-row items-start gap-4">
                        <span className="min-w-[100px] bg-mealicious-primary text-white text-xs text-center font-semibold py-1.5 rounded-sm capitalize">
                          {m.type}
                        </span>
                        <Separator orientation="vertical" className="hidden sm:block"/>
                        <div className="w-full flex-1 flex flex-col items-start gap-3 sm:pb-4.5">
                          <h2 className="font-bold line-clamp-2">{m.title}</h2>
                          <div className="w-full flex flex-col start gap-2.5">
                            {
                              m.recipes.map((r) => (
                                <div key={r.id} className="w-full border border-border flex justify-start gap-4 p-3 rounded-sm">
                                  <div className="relative min-h-[50px] w-[125px] shrink-0">
                                    <Image 
                                      src={r.image}
                                      alt={`Image of ${r.title}`}
                                      fill
                                      className="object-cover object-center rounded-sm"
                                    />
                                  </div>
                                  <div className="w-full flex flex-col gap-2">
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
                                </div>
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
}
