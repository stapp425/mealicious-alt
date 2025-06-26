import { Skeleton } from "@/components/ui/skeleton";
import { MAX_LIST_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";

export default function SearchResultsSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-3">
      <Skeleton className="w-[225px] h-[35px] rounded-sm"/>
      <Skeleton className="w-[325px] h-[25px] rounded-sm"/>
      {
        Array.from({ length: MAX_LIST_RECIPE_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
          <Skeleton key={i} className="w-full h-[500px] sm:h-[175px] rounded-md"/>
        ))
      }
    </div>
  );
}
