"use client";
 
import * as React from "react";
import { Label } from "@/components/ui/label";
import { TimePickerInput } from "@/components/ui/time-picker-input";
import { TimePeriodSelect } from "@/components/ui/period-select";
import { Period } from "@/components/ui/time-picker-utils";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { PlanCreation } from "@/lib/zod";
import { toast } from "sonner";
import { isEqual, isSameDay } from "date-fns";
import { Meal } from "./plan-meal-search";
 
type TimePickerDemoProps = {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  selectedMeal: Meal | null;
  setSelectedMeal: React.Dispatch<React.SetStateAction<Meal | null>>;
};
 
export default function TimePicker({ date, setDate, selectedMeal, setSelectedMeal }: TimePickerDemoProps) {
  const { control } = useFormContext<PlanCreation>();
  const { append } = useFieldArray({ control, name: "meals" });
  const [planMealValues, planDate] = useWatch({ control, name: ["meals", "date"] });

  const [period, setPeriod] = React.useState<Period>("AM");
  
  const hourRef = React.useRef<HTMLInputElement>(null);
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const periodRef = React.useRef<HTMLButtonElement>(null);
 
  return (
    <div className="flex items-end gap-2 p-3 *:flex-1">
      <div className="grid gap-1 text-center">
        <Label htmlFor="plan-hours" className="text-xs">
          Hours
        </Label>
        <TimePickerInput
          id="plan-hours"
          picker="12hours"
          period={period}
          date={date}
          setDate={setDate}
          ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
          className="w-full"
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="plan-minutes" className="text-xs">
          Minutes
        </Label>
        <TimePickerInput
          id="plan-minutes"
          picker="minutes"
          date={date}
          setDate={setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => periodRef.current?.focus()}
          className="w-full"
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="period" className="text-xs">
          Period
        </Label>
        <TimePeriodSelect
          period={period}
          setPeriod={setPeriod}
          date={date}
          setDate={setDate}
          ref={periodRef}
          onLeftFocus={() => minuteRef.current?.focus()}
        />
      </div>
      <button
        type="button"
        disabled={!selectedMeal || planMealValues.some((m) => m.id === selectedMeal?.id)}
        onClick={() => {
          if (!selectedMeal || !date) return;

          if (isSameDay(planDate, date) && date <= planDate) {
            toast.error("Planned date was set to today, so time cannot be set to a past time.");
            return;
          }
          
          if (planMealValues.some((m) => isEqual(m.time, date))) {
            toast.error("A meal with that time is already included.");
            return;
          }

          append({
            id: selectedMeal.id,
            title: selectedMeal.title,
            calories: selectedMeal.calories,
            recipes: selectedMeal.recipes,
            type: selectedMeal.type,
            time: date
          });
          setSelectedMeal(null);
          toast.success("Meal successfully added!");
        }}
        className="mealicious-button h-10 font-semibold text-sm rounded-md"
      >
        Add
      </button>
    </div>
  );
}
