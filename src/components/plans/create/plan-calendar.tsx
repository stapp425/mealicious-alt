"use client";

import { useFormState, useWatch } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { CreatePlanFormSchema } from "@/lib/zod/plan";
import { toast } from "sonner";
import { Info, Calendar as CalendarIcon } from "lucide-react";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { CalendarDayButton } from "@/components/ui/calendar";
import { tz } from "@date-fns/tz";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { UTCDate } from "@date-fns/utc";
import { getPreviewPlansInTimeFrame } from "@/lib/actions/plan";
import { useCreatePlanFormContext } from "@/components/plans/create/create-plan-form";
import { cn } from "@/lib/utils";
import z from "zod/v4";

type PlanCalendarProps = {
  userId: string;
};

const inUtc = { in: tz("UTC") };
const DateSchema = ({
  startDate,
  endDate
}: {
  startDate: Date;
  endDate: Date;
}) => CreatePlanFormSchema.shape.date.check((ctx) => {
  if (isBefore(ctx.value, startDate)) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "Plan date cannot be set on a past date.",
      fatal: true
    });

    return z.NEVER;
  }
  
  if (isAfter(ctx.value, endDate)) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "Plan date cannot be set on a day more than 1 month in the future.",
      fatal: true
    });

    return z.NEVER;
  }
});

export default function PlanCalendar({ userId }: PlanCalendarProps) {
  const {
    now,
    startDate,
    endDate,
    control,
    setValue
  } = useCreatePlanFormContext();
  const date = useWatch({ control, name: "date" });
  const {
    errors: {
      date: dateError
    }
  } = useFormState({ control, name: "date" });

  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansErrored
  } = useQuery({
    queryKey: ["plan-form-calendar-plans", userId, startDate, endDate],
    queryFn: () => getPreviewPlansInTimeFrame({
      userId,
      startDate: new UTCDate(startDate),
      endDate: new UTCDate(endDate)
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  return (
    <section className="grid gap-1.5">
      <h2 className="required-field font-bold text-2xl">Date</h2>
      <p className="font-semibold text-muted-foreground text-sm">
        Add a date to your plan here.
      </p>
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{dateError?.message}</span>
      </div>
      <div className="w-fit bg-mealicious-primary text-white font-semibold text-sm flex items-center gap-2 py-2 px-3 rounded-sm mb-1">
        <CalendarIcon size={16}/>
        Selected Date
        <Separator orientation="vertical"/>
        {date ? format(date, "MMMM do, yyyy") : "None"}
      </div>
      {
        plansErrored && (
          <div className="min-h-8 p-4">
            <div className="error-label flex items-center gap-2 p-2">
              <Info size={16}/>
              There was an error while fetching plans.
            </div>
          </div>
        )
      }
      <Calendar
        mode="single"
        selected={date}
        startMonth={startDate}
        endMonth={endDate}
        onSelect={(calendarDate) => {
          if (!calendarDate || plansLoading || !plans) return;
          if (plans.some((p) => isSameDay(p.date, calendarDate, inUtc))) {
            toast.error("A plan is already set on this day.");
            return;
          }

          setValue(
            "date",
            calendarDate,
            { shouldDirty: true }
          );
        }}
        components={{
          DayButton: ({ day, ...props }) => {
            const shouldDisable = 
              (plans?.filter((p) => isSameDay(p.date, day.date, inUtc)).length ?? 0) > 0 ||
              isBefore(day.date, now) || isAfter(day.date, endDate) ||
              !DateSchema({ startDate, endDate }).safeParse(day.date).success

            const canAccessPlans = !(plansErrored || plansLoading || !plans);
            
            return (
              <CalendarDayButton
                {...props}
                disabled={shouldDisable || !canAccessPlans}
                day={day}
                className={cn(canAccessPlans && "disabled:text-red-400")}
              />
            );
          }
        }}
        className="rounded-lg border w-full h-fit"
      />
    </section>
  );
}
