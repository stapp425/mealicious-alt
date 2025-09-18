"use client";

import { Calendar } from "@/components/ui/calendar";
import { endOfDay, endOfMonth, endOfWeek, format, isSameDay, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { CalendarDayButton as NextCalendarDayButton } from "@/components/ui/calendar"
import { DayButton, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { ComponentProps, memo, useMemo, useState } from "react";
import { getDetailedPlansInTimeFrame, getPreviewPlansInTimeFrame } from "@/lib/actions/plan";
import { usePlanCalendarContext } from "@/components/plans/calendar/plan-calendar";
import { tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { useQuery } from "@tanstack/react-query";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { mealTypes } from "@/lib/types";
import { PreviewPlan } from "@/lib/zod/plan";
import Image from "next/image";
import { Flame, Info } from "lucide-react";
import Link from "next/link";


const inUtc = { in: tz("UTC") };
const defaultClassNames = getDefaultClassNames();

export default function CalendarMonth() {
  const { userId, date, setDate } = usePlanCalendarContext();

  const { startDate, endDate } = useMemo(
    () => ({
      startDate: new UTCDate(startOfWeek(
        startOfMonth(date, inUtc),
        inUtc
      )),
      endDate: new UTCDate(endOfWeek(
        endOfMonth(date, inUtc),
        inUtc
      ))
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
      { startDate, endDate },
      { type: "month" },
    ],
    queryFn: () => getPreviewPlansInTimeFrame({
      userId,
      startDate,
      endDate
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  return (
    <>
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
    <Calendar
      mode="single"
      month={date}
      onMonthChange={(date) => setDate(startOfMonth(date))}
      components={{
        DayButton: ({ day, modifiers, ...props }) => {
          return (
            <CalendarDayButton 
              day={day}
              modifiers={modifiers}
              plans={plans?.filter((p) => isSameDay(day.date, p.date, inUtc))}
              {...props}
            />
          );
        }
      }}
      disabled={plansLoading}
      className="rounded-lg border w-full h-fit"
      classNames={{
        day: cn(
          "relative size-full p-0 text-center data-[today=true]:rounded-full data-[today=true]:bg-transparent group/day aspect-square select-none transition-colors",
          defaultClassNames.day
        ),
        caption_label: cn(
          "cursor-pointer text-xl font-bold flex items-center gap-2 py-1.5 px-3",
          defaultClassNames.caption_label
        )
      }}
    />
    </>
  );
}

const CalendarDayButton = memo(({
  className,
  day,
  plans,
  ...props
}: ComponentProps<typeof DayButton> & {
  plans?: PreviewPlan[];
}) => {
  const { userId } = usePlanCalendarContext();
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);

  const startDate = new UTCDate(startOfDay(day.date, inUtc));
  const endDate = new UTCDate(endOfDay(day.date, inUtc));

  const {
    data: fetchedPlans,
    isLoading: fetchedPlansLoading
  } = useQuery({
    queryKey: ["daily-plan", userId, { startDate, endDate }],
    queryFn: () => getDetailedPlansInTimeFrame({
      userId,
      startDate,
      endDate
    }),
    enabled: touched,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
    >
      <NextCalendarDayButton
        {...props}
        data-content={(plans?.length ?? 0) > 0}
        day={day}
        onClick={(e) => {
          e.currentTarget.blur();
          if ((plans?.length ?? 0) > 0) {
            setOpen(true);
            setTouched(true);
          } else {
            toast("No plans are currently set for this day.");
          }
        }}
        className={cn(
          "size-3/4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 data-[content=true]:rounded-full data-[content=true]:border-2 data-[content=true]:border-mealicious-primary data-[content=true]:hover:bg-mealicious-primary-muted/85 data-[content=true]:hover:dark:bg-mealicious-primary-muted/65 [[data-today=true]_&]:rounded-full [[data-today=true]_&[data-content=true]]:bg-mealicious-primary-muted/35 [[data-today=true]_&:hover]:bg-sidebar transition-all",
          className
        )}
      />
      <DrawerContent className="@container/drawer h-9/10 @min-2xl:h-3/4" >
        <VisuallyHidden>
          <DrawerHeader>
            <DrawerTitle>Plans Details</DrawerTitle>
            <DrawerDescription>Shows a comprehensive view of the plan set on a certain day.</DrawerDescription>
          </DrawerHeader>
        </VisuallyHidden>
        <div className="sticky z-10 top-0 bg-background border-b border-b-border">
          <div className="max-w-188 flex justify-center items-center gap-4 mx-auto p-4">
            <span className="bg-mealicious-primary text-white font-semibold tracking-widest py-1 px-4 rounded-sm">
              {format(day.date, "E").toUpperCase()}
            </span>
            <h1 className="font-bold text-2xl">{format(day.date, "MMM d, yyyy")}</h1>
          </div>
        </div>
        <div className="size-full overflow-y-auto">
          <div className="size-full max-w-188 mx-auto p-4">
            {
              (fetchedPlansLoading || !fetchedPlans) ? (
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
                  <div className="flex flex-col gap-3 @min-2xl/drawer:gap-0">
                    {
                      Array.from({ length: 3 }, (_, i) => i).map((i) => (
                        <div key={i} className="w-full flex gap-4 rounded-sm">
                          <div className="w-full text-left flex flex-col @min-2xl/drawer:flex-row items-start gap-4">
                            <div className="w-24 grid gap-2.5 shrink-0 @min-2xl/drawer:mb-4.5">
                              <Skeleton className="w-4/5 h-6"/>
                              <Skeleton className="w-full h-6"/>
                            </div>
                            <Separator orientation="vertical" className="hidden @min-2xl/drawer:block"/>
                            <div className="w-full flex-1 grid items-start gap-3 @min-2xl/drawer:mb-4.5">
                              <Skeleton className="w-38 h-6"/>
                              <div className="w-full grid gap-2.5">
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
              ) : (
                <>
                {
                  fetchedPlans.map((p) => (
                    <div key={p.id} className="grid gap-2">
                      <h2 className="font-bold text-2xl">{p.title}</h2>
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
                      <div className="flex flex-col gap-3 @min-2xl/drawer:gap-0">
                        {
                          p.meals.sort((a, b) => mealTypes.indexOf(a.type) - mealTypes.indexOf(b.type)).map((m) => (
                            <div
                              key={`${m.id}-${m.type}`}
                              className="w-full flex gap-4 rounded-sm"
                            >
                              <div key={m.id} className="w-full text-left flex flex-col @min-2xl/drawer:flex-row items-start gap-4">
                                <span className="min-w-24 bg-mealicious-primary text-white text-xs text-center font-semibold py-1.5 rounded-sm capitalize">
                                  {m.type}
                                </span>
                                <Separator orientation="vertical" className="hidden @min-2xl/drawer:block"/>
                                <div className="w-full flex-1 flex flex-col items-start gap-3 @min-2xl/drawer:mb-4.5">
                                  <h2 className="font-bold line-clamp-2">{m.title}</h2>
                                  <div className="w-full grid gap-2.5">
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
                      </div>
                    </div>
                  ))
                }
                </>
              )
            }
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

CalendarDayButton.displayName = "CalendarDayButton";
