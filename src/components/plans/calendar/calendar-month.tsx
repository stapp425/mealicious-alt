"use client";

import { Calendar } from "@/components/ui/calendar";
import { endOfMonth, endOfWeek, isSameDay, startOfMonth, startOfWeek } from "date-fns";
import CalendarDayButton from "@/components/plans/calendar/calendar-month-day";
import { getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getPreviewPlansInTimeFrame } from "@/lib/actions/plan";
import { usePlanCalendarContext } from "@/components/plans/calendar/plan-calendar";
import { tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { PreviewPlan } from "@/lib/zod/plan";
import { useSession } from "next-auth/react";

const utc = tz("UTC");
const defaultClassNames = getDefaultClassNames();

export default function CalendarMonth() {
  const { date, setDate } = usePlanCalendarContext();
  const { data } = useSession();
  const [isPending, startTransition] = useTransition();
  const [plans, setPlans] = useState<PreviewPlan[]>([]);

  useEffect(() => {
    if (!data?.user?.id) return;
    const userId = data.user.id;
    startTransition(async () => {
      const result = await getPreviewPlansInTimeFrame({
        userId,
        startDate: new UTCDate(startOfWeek(
          startOfMonth(date, { in: utc }),
          { in: utc }
        )),
        endDate: new UTCDate(endOfWeek(
          endOfMonth(date, { in: utc }),
          { in: utc }
        ))
      });
      setPlans(result);
    });
  }, [data, date.toISOString()]);
  
  return (
    <Calendar
      mode="single"
      month={date}
      onMonthChange={(date) => setDate(startOfMonth(date))}
      components={{
        DayButton: ({ day, modifiers, ...props }) => {
          const filteredPlans = useMemo(
            () => plans.filter((p) => isSameDay(p.date, day.date, { in: utc })),
            [plans]
          );
          
          return (
            <CalendarDayButton 
              day={day}
              modifiers={modifiers}
              plans={filteredPlans}
              {...props}
            />
          );
        }
      }}
      disabled={isPending}
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
  );
}
