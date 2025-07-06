import { Metadata } from "next";
import PlanViews from "@/components/plans/calendar/plan-views";
import PlanCalendar from "@/components/plans/calendar/plan-calendar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MorePlans from "@/components/plans/calendar/more-plans";
import { Suspense } from "react";
import { nanoid } from "nanoid";
import { createLoader, parseAsIndex, parseAsString, parseAsStringLiteral, SearchParams } from "nuqs/server";
import { morePlansTimeFrame, morePlansView } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import MorePlansOptions from "@/components/plans/calendar/more-plans-options";
import Pagination from "@/components/plans/calendar/pagination";
import { getPlansInTimeFrameCount } from "@/lib/actions/plan";
import { addMilliseconds, addMonths, addWeeks, addYears, startOfDay } from "date-fns";
import { tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { MAX_PLAN_DISPLAY_LIMIT } from "@/lib/utils";
import MorePlansSearchBar from "@/components/plans/calendar/more-plans-search-bar";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Plan Calendar | Mealicious",
  description: "Find your mealicious plans here!"
};

const loadSearchParams = createLoader({
  query: parseAsString.withDefault(""),
  view: parseAsStringLiteral(morePlansView).withDefault("upcoming"),
  timeframe: parseAsStringLiteral(morePlansTimeFrame),
  page: parseAsIndex.withDefault(0)
}, {
  urlKeys: {
    view: "mode"
  }
});

const inUtc = { in: tz("UTC") };

export default async function Page({ searchParams }: PageProps) {  
  const { query, timeframe, view, page } = await loadSearchParams(searchParams);
  
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  const startOfDayNow = startOfDay(now, inUtc);
    let date1: Date | null = null;
    let date2: Date | null = null;
  
    if (timeframe) {
      if (view === "upcoming") {
        date1 = startOfDayNow;
        switch (timeframe) {
          case "week":
          date2 = addWeeks(date1, 1, inUtc);
          break;
        case "month":
          date2 = addMonths(date1, 1, inUtc);
          break;
        case "year":
          date2 = addYears(date1, 1, inUtc);
          break;
        }
      } else {
        date2 = startOfDayNow;
        switch (timeframe) {
          case "week":
          date1 = addWeeks(date2, -1, inUtc);
          break;
        case "month":
          date1 = addMonths(date2, -1, inUtc);
          break;
        case "year":
          date1 = addYears(date2, -1, inUtc);
          break;
        }
      }
    } else {
      if (view === "upcoming")
        date1 = startOfDayNow;
      else
        date2 = startOfDayNow;
    }

  const [{ count: plansCount }] = await getPlansInTimeFrameCount({
    userId,
    startDate: date1 ? new UTCDate(date1) : undefined,
    endDate: date2 ? new UTCDate(addMilliseconds(date2, -1, inUtc)) : undefined,
  });
  
  return (
    <div className="h-full w-full max-w-[1000px] flex flex-col gap-3 mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-2">
        <h1 className="font-bold text-4xl">Plan Calendar</h1>
        <PlanViews />
      </div>
      <PlanCalendar />
      <h2 className="font-bold text-4xl capitalize mb-2">{view} Plans</h2>
      <MorePlansSearchBar />
      <MorePlansOptions />
      <Separator />
      <Suspense key={nanoid()} fallback={<PlansSkeleton />}>
        <MorePlans
          userId={userId}
          startDate={date1}
          endDate={date2}
          searchParams={{ query, timeframe, view, page }}
        />
      </Suspense>
      <Pagination totalPages={Math.ceil(plansCount / MAX_PLAN_DISPLAY_LIMIT)}/>
    </div>
  );
}

function PlansSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-48 h-8"/>
      <div className="flex flex-wrap gap-2.5">
        {
          Array.from({ length: 5 }, (_, i) => (i)).map((i) => (
            <Skeleton key={i} className="w-[100px] h-[25px] rounded-full py-1 px-3"/>
          ))
        }
      </div>
      <Skeleton className="w-full h-6"/>
      <div className="flex flex-col gap-3 sm:gap-0">
        {
          Array.from({ length: 3 }, (_, i) => i).map((i) => (
            <div key={i} className="w-full flex gap-4 rounded-sm">
              <div className="w-full text-left flex flex-col sm:flex-row items-start gap-4">
                <div className="w-[100px] flex flex-col gap-2.5 shrink-0 sm:pb-4.5">
                  <Skeleton className="w-4/5 h-6"/>
                  <Skeleton className="w-full h-6"/>
                </div>
                <Separator orientation="vertical" className="hidden sm:block"/>
                <div className="w-full flex-1 flex flex-col items-start gap-3 sm:pb-4.5">
                  <Skeleton className="w-38 h-6"/>
                  <div className="w-full flex flex-col start gap-2.5">
                    {
                      Array.from({ length: 3 }, (_, i) => i).map((i) => (
                        <Skeleton key={i} className="w-full h-25"/>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
