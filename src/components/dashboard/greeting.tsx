"use client";

import { format, getHours } from "date-fns";
import { Calendar } from "lucide-react";

type GreetingProps = {
  name: string;
};

// Create component in client to use client's time zone
export default function Greeting({ name }: GreetingProps) {
  const now = new Date();
  
  return (
    <div className="flex-1 @min-2xl:flex-auto flex flex-col items-center @min-2xl:items-start gap-1">
      <h1 className="font-bold text-2xl @min-2xl:text-3xl">{getGreeting(now)}, {name}!</h1>
      <span className="font-semibold text-muted-foreground text-lg">Welcome to Mealicious!</span>
      <div className="border border-border dark:bg-sidebar w-fit font-semibold text-sm flex items-center gap-2.5 mt-auto py-2 px-4 rounded-sm">
        <Calendar size={16}/>
        <span className="-mb-0.5">{format(now, "MMMM do, yyyy")}</span>
      </div>
    </div>
  );
}

function getGreeting(date: Date): string {
  const hour = getHours(date);
  if (hour < 12)
    return "Good morning";
  else if (hour < 17) 
    return "Good afternoon";
  else
    return "Good evening";
}
