import { getDetailedPlansInTimeFrame } from "@/lib/actions/plan";
import { MorePlansTimeFrame, MorePlansView } from "@/lib/types";
import { MAX_PLAN_DISPLAY_LIMIT } from "@/lib/utils";;
import { tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { addMilliseconds } from "date-fns";
import { SearchX } from "lucide-react";
import MorePlansResult from "@/components/plans/calendar/more-plans-result";

type MorePlansProps = {
  userId: string;
  startDate: Date | null;
  endDate: Date | null;
  searchParams: {
    query: string;
    view: MorePlansView;
    timeframe: MorePlansTimeFrame | null;
    page: number;
  };
};

const inUtc = { in: tz("UTC") };

export default async function MorePlans({ userId, startDate, endDate, searchParams }: MorePlansProps) {
  const { query, view, page } = searchParams;
  
  const plans = await getDetailedPlansInTimeFrame({
    userId,
    query,
    startDate: startDate ? new UTCDate(startDate) : undefined,
    endDate: endDate ? new UTCDate(addMilliseconds(endDate, -1, inUtc)) : undefined,
    limit: MAX_PLAN_DISPLAY_LIMIT,
    offset: page * MAX_PLAN_DISPLAY_LIMIT
  });
  
  return (
    <div className="flex flex-col gap-3">
      {
        plans.length > 0 ? (
          <div className="flex flex-col gap-3">
            {
              plans.map((p) => (
                <MorePlansResult 
                  key={p.id}
                  plan={p}
                  view={view}
                />
              ))
            }
          </div>
        ) : (
          <div className="bg-sidebar border border-border w-full flex flex-col justify-center items-center gap-6 py-10 px-8 rounded-md">
            <SearchX size={60} className="stroke-muted-foreground"/>
            <div className="flex flex-col items-center gap-2">
              <h3 className="font-bold text-lg mt-auto">No Plan Found!</h3>
              <span className="font-semibold text-center text-muted-foreground">Try making another search or start creating one!</span>
            </div>
          </div>
        )
      }
    </div>
  );
}
