import { Skeleton } from "@/components/ui/skeleton";
import { MAX_MEAL_DISPLAY_LIMIT } from "@/lib/utils";

export default function SearchResultsSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-3">
      <Skeleton className="w-[225px] h-[35px] rounded-sm"/>
      <Skeleton className="w-[325px] h-[25px] rounded-sm"/>
      <div className="w-full grid lg:grid-cols-2 gap-3">
        {
          Array.from({ length: MAX_MEAL_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
            <Skeleton key={i} className="h-[475px] rounded-md"/>
          ))
        }
      </div>
    </div>
  );
}
