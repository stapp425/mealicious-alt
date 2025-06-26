import { Skeleton } from "@/components/ui/skeleton";
import { MAX_GRID_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";

export default function SearchResultsSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col gap-3">
      <Skeleton className="w-[225px] h-[35px] rounded-sm"/>
      <Skeleton className="w-[325px] h-[25px] rounded-sm"/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {
          Array.from({ length: MAX_GRID_RECIPE_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
            <Skeleton key={i} className="h-[500px] sm:h-[425px] rounded-md"/>
          ))
        }
      </div>
    </div>
  );
}
