"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { PlanCreation, PlanCreationSchema } from "@/lib/zod";
import { startOfDay, add } from "date-fns";
import { toast } from "sonner";
import { Info } from "lucide-react";

const now = startOfDay(new Date());

const DateSchema = PlanCreationSchema.shape.date;

export default function PlanCalendar() {
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
        startMonth={now}
        endMonth={add(now, { months: 1 })}
        onSelect={(date) => {
          const dateValidation = DateSchema.safeParse(date);
          
          if (!dateValidation.success) {
            toast.error(dateValidation.error.errors[0].message);
            return;
          }

          const parsedData = dateValidation.data;
          setValue("date", parsedData);
        }}
        className="rounded-lg border w-full h-fit"
      />
    </div>
  );
}
