"use client";

import { getDate, getMonth, getYear } from "date-fns";
import { parseAsIndex, parseAsInteger, parseAsStringLiteral, useQueryState, useQueryStates } from "nuqs";
import { useCallback, useMemo, createContext, useContext } from "react";
import { planViews } from "@/lib/types";
import CalendarWeek from "@/components/plans/calendar/calendar-week";
import CalendarMonth from "@/components/plans/calendar/calendar-month";

const now = new Date();

export default function PlanCalendar() {
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
  
  const calendarDate = useMemo(() => new Date(year, month, day), [year, month, day]);
  const setDateFn = useCallback((date: Date) => setDate({
    year: getYear(date),
    month: getMonth(date),
    day: getDate(date)
  }), [year, month, day]);
  
  return (
    <PlanCalendarProvider date={calendarDate} setDate={setDateFn}>
      { view === "monthly" ? <CalendarMonth /> : <CalendarWeek /> }
    </PlanCalendarProvider>
  );
}

type PlanCalendarContextProps = {
  date: Date;
  setDate: (date: Date) => void;
};

const PlanCalendarContext = createContext<PlanCalendarContextProps | null>(null);

export function usePlanCalendarContext() {
  const context = useContext(PlanCalendarContext);
  if (!context) throw new Error("usePlanCalendarContext can only be used within a PlanCalendarContext.");
  return context;
}

export function PlanCalendarProvider({ children, date, setDate }: { children: React.ReactNode } & PlanCalendarContextProps) {
  return (
    <PlanCalendarContext.Provider value={{ date, setDate }}>
      {children}
    </PlanCalendarContext.Provider>
  );
}
