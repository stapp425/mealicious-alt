"use client";

import { PreviewPlan } from "@/lib/zod";
import { createContext, useContext } from "react";

type CreatePlanFormContextProps = {
  userId: string;
  startDate: Date;
  endDate: Date;
  plans: PreviewPlan[];
};

type PlanCalendarProviderProps = {
  children: React.ReactNode;
} & CreatePlanFormContextProps;

const PlanCalendarContext = createContext<CreatePlanFormContextProps | null>(null);

export function useCreatePlanFormContext() {
  const context = useContext(PlanCalendarContext);
  if (!context) throw new Error("useCreatePlanFormContext can only be used within a PlanCalendarContext.");
  return context;
}

export default function PlanCalendarProvider({ children, userId, startDate, endDate, plans }: PlanCalendarProviderProps) {
  return (
    <PlanCalendarContext.Provider value={{ userId, startDate, endDate, plans }}>
      {children}
    </PlanCalendarContext.Provider>
  );
}
