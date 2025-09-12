import { Skeleton } from "@/components/ui/skeleton";

export default function RecipesSkeleton() {
  return (
    <section className="flex-1 flex flex-col gap-3">
      <Skeleton className="w-46 h-10 rounded-md"/>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {
          Array.from({ length: 12 }, (_, i) => i).map((i) => (
            <Skeleton key={i} className="h-64 rounded-md"/>
          ))
        }
      </div>
    </section>
  );
}
