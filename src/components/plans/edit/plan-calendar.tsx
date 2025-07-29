"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { EditPlanFormSchema, EditPlanForm } from "@/lib/zod/plan";
import { toast } from "sonner";
import { Info, Calendar as CalendarIcon } from "lucide-react";
import { useEditPlanFormContext } from "@/components/plans/edit/edit-plan-form-provider";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { CalendarDayButton } from "@/components/ui/calendar";
import { tz } from "@date-fns/tz";
import { Separator } from "@/components/ui/separator";

const now = new Date();
const inUtc = { in: tz("UTC") };
const DateSchema = EditPlanFormSchema.shape.date;

export default function PlanCalendar() {
  const { startDate, endDate, plans, planToEdit: { date: planToEditDate } } = useEditPlanFormContext();
  const {
    control,
    setValue,
    formState: {
      errors
    }
  } = useFormContext<EditPlanForm>();
  const date = useWatch({ control, name: "date" });

  return (
    <div className="grid gap-3">
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
      <div className="w-fit bg-mealicious-primary font-semibold text-sm flex items-center gap-2 py-2 px-3 rounded-sm">
        <CalendarIcon size={16}/>
        Selected Date
        <Separator orientation="vertical"/>
        {format(date, "MMMM do, yyyy")}
      </div>
      <Calendar
        mode="single"
        selected={date}
        startMonth={startDate}
        endMonth={endDate}
        onSelect={(calendarDate) => {
          if (!calendarDate) return;
          if (!isSameDay(calendarDate, planToEditDate, inUtc) && plans.some((p) => isSameDay(p.date, calendarDate, inUtc))) {
            toast.error("A plan is already set on this day.");
            return;
          }

          setValue("date", calendarDate);
        }}
        components={{
          DayButton: ({ day, ...props }) => {
            const shouldDisable = !isSameDay(day.date, planToEditDate, inUtc) && (
              plans.filter((p) => isSameDay(p.date, day.date, inUtc)).length !== 0 ||
              isBefore(day.date, now) || isAfter(day.date, endDate) ||
              !DateSchema.safeParse(day.date).success
            );
            
            return (
              <CalendarDayButton
                {...props}
                disabled={shouldDisable}
                day={day}
                className="disabled:text-red-400"
              />
            );
          }
        }}
        className="rounded-lg border w-full h-fit"
      />
    </div>
  );
}
