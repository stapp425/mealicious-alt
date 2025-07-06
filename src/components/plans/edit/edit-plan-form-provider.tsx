"use client";

import { DetailedPlan, PreviewPlan } from "@/lib/zod";
import { createContext, useContext } from "react";

type EditPlanFormContextProps = {
  userId: string;
  startDate: Date;
  endDate: Date;
  plans: PreviewPlan[];
  planToEdit: DetailedPlan;
};

type PlanCalendarProviderProps = {
  children: React.ReactNode;
} & EditPlanFormContextProps;

const PlanCalendarContext = createContext<EditPlanFormContextProps | null>(null);

export function useEditPlanFormContext() {
  const context = useContext(PlanCalendarContext);
  if (!context) throw new Error("useEditPlanFormContext can only be used within a PlanCalendarContext.");
  return context;
}

export default function PlanCalendarProvider({ children, userId, startDate, endDate, plans, planToEdit }: PlanCalendarProviderProps) {
  return (
    <PlanCalendarContext.Provider value={{ userId, startDate, endDate, plans, planToEdit }}>
      {children}
    </PlanCalendarContext.Provider>
  );
}
