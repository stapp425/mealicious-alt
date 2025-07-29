"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { CalendarDayButton as NextCalendarDayButton } from "@/components/ui/calendar"
import { DayButton } from "react-day-picker";
import { format, startOfDay, endOfDay } from "date-fns";
import { tz } from "@date-fns/tz"
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState, useTransition } from "react";
import { getDetailedPlansInTimeFrame } from "@/lib/actions/plan";
import { useSession } from "next-auth/react";
import { Flame } from "lucide-react";
import { DetailedPlan, PreviewPlan } from "@/lib/zod/plan";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { UTCDate } from "@date-fns/utc";
import { mealTypes } from "@/lib/types";

type CalendarDayButtonProps = {
  plans: PreviewPlan[];
} & React.ComponentProps<typeof DayButton>;

export default function CalendarDayButton(props: CalendarDayButtonProps) {
  const { plans, className, day, ...rest } = props;
  const { data } = useSession();
  const [touched, setTouched] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [fetchedPlans, setFetchedPlans] = useState<DetailedPlan[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (touched || !open || !data?.user?.id) return;
    const userId = data.user.id;
    startTransition(async () => {
      const utc = tz("UTC");
      const result = await getDetailedPlansInTimeFrame({
        userId,
        startDate: new UTCDate(startOfDay(day.date, { in: utc })),
        endDate: new UTCDate(endOfDay(day.date, { in: utc }))
      });
      setFetchedPlans(result);
      setTouched(true);
    });
  }, [open, data?.user?.id, day.date, touched]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <NextCalendarDayButton
        data-content={plans.length > 0}
        day={day}
        {...rest}
        onClick={(e) => {
          e.currentTarget.blur();
          if (plans.length > 0)
            setOpen(true);
          else 
            toast("No plans are currently set for this day.");
        }}
        className={cn(
          "size-3/4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 data-[content=true]:rounded-full data-[content=true]:border-2 data-[content=true]:border-mealicious-primary data-[content=true]:hover:bg-mealicious-primary-muted/85 data-[content=true]:hover:dark:bg-mealicious-primary-muted/65 [[data-today=true]_&]:rounded-full [[data-today=true]_&[data-content=true]]:bg-mealicious-primary-muted/35 [[data-today=true]_&:hover]:bg-sidebar transition-all",
          className
        )}
      />
      <DrawerContent className="h-9/10 sm:h-3/4" >
        <VisuallyHidden>
          <DrawerHeader>
            <DrawerTitle>Plans Details</DrawerTitle>
            <DrawerDescription>Shows a comprehensive view of the plan set on a certain day.</DrawerDescription>
          </DrawerHeader>
        </VisuallyHidden>
        <div className="sticky z-10 top-0 bg-background border-b border-b-border">
          <div className="max-w-[750px] flex justify-center items-center gap-4 mx-auto p-4">
            <span className="bg-mealicious-primary text-white font-semibold tracking-widest py-1 px-4 rounded-sm">
              {format(day.date, "E").toUpperCase()}
            </span>
            <h1 className="font-bold text-2xl">{format(day.date, "MMM d, yyyy")}</h1>
          </div>
        </div>
        <div className="size-full overflow-y-auto">
          <div className="size-full max-w-[750px] mx-auto p-4">
            {
              isPending ? (
                <PlansSkeleton />
              ) : (
                <>
                {
                  fetchedPlans.map((p) => (
                    <div key={p.id} className="flex flex-col gap-2">
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
                      <div className="flex flex-col gap-3 sm:gap-0">
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
}

function PlansSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-48 h-8"/>
      <div className="flex flex-wrap gap-2.5">
        {
          Array.from({ length: 5 }, (_, i) => (i)).map((i) => (
            <Skeleton key={i} className="w-[100px] h-[25px] rounded-full py-1 px-3"/>
          ))
        }
      </div>
      <Skeleton className="w-full h-6"/>
      <div className="flex flex-col gap-3 sm:gap-0">
        {
          Array.from({ length: 3 }, (_, i) => i).map((i) => (
            <div key={i} className="w-full flex gap-4 rounded-sm">
              <div className="w-full text-left flex flex-col sm:flex-row items-start gap-4">
                <div className="w-[100px] flex flex-col gap-2.5 shrink-0 sm:pb-4.5">
                  <Skeleton className="w-4/5 h-6"/>
                  <Skeleton className="w-full h-6"/>
                </div>
                <Separator orientation="vertical" className="hidden sm:block"/>
                <div className="w-full flex-1 flex flex-col items-start gap-3 sm:pb-4.5">
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
