"use client";

import { Calendar, ChevronDown, Flame } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DetailedPlan } from "@/lib/zod";
import { useState } from "react";
import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { mealTypes, MorePlansView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

type MorePlansResultProps = {
  view: MorePlansView;
  plan: DetailedPlan;
};

const inUtc = { in: tz("UTC") };

export default function MorePlansResult({ view, plan }: MorePlansResultProps) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <div className="flex flex-col gap-2 transition-all">
        <h2 className="font-bold text-2xl">{plan.title}</h2>
        <div className="flex items-center gap-2 text-muted-foreground font-semibold">
          <Calendar size={16}/>
          {format(plan.date, "MMMM do, yyyy", inUtc)}
        </div>
        {
          plan.tags.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {
                plan.tags.map((t) => (
                  <div 
                    key={t}
                    className={cn(
                      view === "past" && "grayscale",
                      "bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3"
                    )}
                  >
                    {t}
                  </div>
                ))
              }
            </div>
          )
        }
        <p className={cn(
          plan.description ? "line-clamp-1" : "italic",
          "text-muted-foreground group-disabled:text-secondary"
        )}>
          {plan.description || "No description is available."}
        </p>
        <CollapsibleTrigger className="[&[data-state=open]_svg]:rotate-180" asChild>
          <Button className="cursor-pointer w-fit flex gap-2 px-4! items-center" variant="secondary">
            {open ? "Hide Meal Details" : "Show Meal Details"}
            <ChevronDown className="transition-all"/>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3 sm:gap-0">
          {
            plan.meals.sort((a, b) => mealTypes.indexOf(a.type) - mealTypes.indexOf(b.type)).map((m) => (
              <div
                key={`${m.id}-${m.type}`}
                className="w-full flex gap-4 rounded-sm"
              >
                <div key={m.id} className="w-full text-left flex flex-col sm:flex-row items-start gap-4">
                  <span className={cn(
                    view === "past" && "grayscale",
                    "capitalize min-w-[100px] bg-mealicious-primary text-white text-xs text-center font-semibold py-1.5 rounded-sm"
                  )}>
                    {m.type}
                  </span>
                  <Separator orientation="vertical" className="hidden sm:block"/>
                  <div className="w-full flex-1 flex flex-col items-start gap-3 sm:pb-4.5">
                    <h2 className="font-bold line-clamp-2">{m.title}</h2>
                    <div className="w-full flex flex-col start gap-2.5">
                      {
                        m.recipes.map((r) => (
                          <div key={r.id} className="w-full border border-border flex justify-start gap-4 p-3 rounded-sm">
                            <div className="relative min-h-[50px] w-[125px] shrink-0">
                              <Image 
                                src={r.image}
                                alt={`Image of ${r.title}`}
                                fill
                                className={cn(
                                  view === "past" && "grayscale",
                                  "object-cover object-center rounded-sm"
                                )}
                              />
                            </div>
                            <div className="w-full flex flex-col gap-2">
                              <h2 className="font-bold line-clamp-1">{r.title}</h2>
                              <div className="text-muted-foreground font-semibold text-xs flex items-center gap-1">
                                <Flame size={14} className="fill-muted-foreground"/>
                                {Number(r.calories).toLocaleString()} Calories
                              </div>
                              <p className={cn(
                                r.description ? "line-clamp-1" : "italic",
                                "text-muted-foreground group-disabled:text-secondary"
                              )}>
                                {r.description || "No description is available."}
                              </p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
