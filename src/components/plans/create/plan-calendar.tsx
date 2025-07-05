"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { PlanCreation, PlanCreationSchema } from "@/lib/zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { useCreatePlanFormContext } from "@/components/plans/create/create-plan-form-provider";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { CalendarDayButton } from "@/components/ui/calendar";
import { tz } from "@date-fns/tz";

const now = new Date();
const inUtc = { in: tz("UTC") };
const DateSchema = PlanCreationSchema.shape.date;

export default function PlanCalendar() {
  const { startDate, endDate, plans } = useCreatePlanFormContext();
  const {
    control,
    setValue,
    formState: {
      errors
    }
  } = useFormContext<PlanCreation>();
  const date = useWatch({ control, name: "date" });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="required-field font-bold text-2xl">Date</h2>
      <p className="font-semibold text-muted-foreground">
        Add a date to your plan here.
      </p>
      {
        errors?.date?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errors.date.message}
          </div>
        )
      }
      <Calendar
        mode="single"
        selected={date}
        startMonth={startDate}
        endMonth={endDate}
        onSelect={(calendarDate) => {
          if (!calendarDate) return;
          if (plans.some((p) => isSameDay(p.date, calendarDate, inUtc))) {
            toast.error("A plan is already set on this day.");
            return;
          }

          setValue("date", calendarDate);
        }}
        components={{
          DayButton: ({ day, ...props }) => {
            const shouldDisable = 
              plans.filter((p) => isSameDay(p.date, day.date, inUtc)).length !== 0 ||
              isBefore(day.date, now) || isAfter(day.date, endDate) ||
              !DateSchema.safeParse(day.date).success
            
            return (
              <CalendarDayButton
                {...props}
                disabled={shouldDisable}
                day={day}
              />
            );
          }
        }}
        className="rounded-lg border w-full h-fit"
      />
    </div>
  );
}
