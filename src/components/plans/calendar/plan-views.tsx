"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanView, planViews } from "@/lib/types";
import { Calendar, AlignJustify } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

export default function PlanViews() {
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(planViews)
      .withDefault("monthly")
  );
  
  return (
    <Tabs value={view} onValueChange={(val) => setView(val as PlanView)}>
      <TabsList className="bg-transparent gap-2 p-0">
        <TabsTrigger
          value="monthly"
          className="cursor-pointer border-border data-[state=active]:border-none data-[state=active]:cursor-default data-[state=active]:bg-mealicious-primary data-[state=active]:text-white dark:data-[state=active]:bg-mealicious-primary data-[state=inactive]:hover:bg-secondary transition-colors p-4"
        >
          <Calendar />
          <span className="hidden md:inline">Monthly</span>
        </TabsTrigger>
        <TabsTrigger
          value="weekly"
          className="cursor-pointer border-border data-[state=active]:border-none data-[state=active]:cursor-default data-[state=active]:bg-mealicious-primary data-[state=active]:text-white dark:data-[state=active]:bg-mealicious-primary data-[state=inactive]:hover:bg-secondary transition-colors p-4"
        >
          <AlignJustify />
          <span className="hidden md:inline">Weekly</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
