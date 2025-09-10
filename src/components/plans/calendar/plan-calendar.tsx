"use client";

import { getDate, getMonth, getYear } from "date-fns";
import { parseAsIndex, parseAsInteger, parseAsStringLiteral, useQueryState, useQueryStates } from "nuqs";
import { useCallback, useMemo, createContext, useContext } from "react";
import { planViews } from "@/lib/types";
import CalendarWeek from "@/components/plans/calendar/calendar-week";
import CalendarMonth from "@/components/plans/calendar/calendar-month";

type PlanCalendarProps = {
  userId: string;
};

type PlanCalendarContextProps = {
  userId: string;
  date: Date;
  setDate: (date: Date) => void;
};

const now = new Date();

const PlanCalendarContext = createContext<PlanCalendarContextProps | null>(null);

export function usePlanCalendarContext() {
  const context = useContext(PlanCalendarContext);
  if (!context) throw new Error("usePlanCalendarContext can only be used within a PlanCalendarContext.");
  return context;
}

export default function PlanCalendar({ userId }: PlanCalendarProps) {
  const [view] = useQueryState(
    "view",
    parseAsStringLiteral(planViews)
      .withDefault("monthly")
  );

  const [{ year, month, day }, setDate] = useQueryStates({
    year: parseAsInteger
      .withDefault(getYear(now))
      .withOptions({
        clearOnDefault: false
      }),
    month: parseAsIndex
      .withDefault(getMonth(now))
      .withOptions({
        clearOnDefault: false
      }),
    day: parseAsInteger
      .withDefault(getDate(now))
      .withOptions({
        clearOnDefault: false
      })
  });

  const setDateFn = useCallback((date: Date) => setDate({
    year: getYear(date),
    month: getMonth(date),
    day: getDate(date)
  }), [setDate]);

  const providerProps = useMemo(
    () => ({
      userId,
      date: new Date(year, month, day),
      setDate: setDateFn
    }),
    [
      userId,
      year,
      month,
      day,
      setDateFn
    ]
  );
  
  return (
    <PlanCalendarContext value={providerProps}>
      { view === "monthly" ? <CalendarMonth /> : <CalendarWeek /> }
    </PlanCalendarContext>
  );
}
