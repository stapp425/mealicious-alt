"use client";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecipeStatistics } from "@/lib/actions/recipe";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Heart, Info, Star } from "lucide-react";
import { ComponentProps, useMemo } from "react";

export default function Statistics({
  recipeId,
  className,
  ...props
}: ComponentProps<"div"> & {
  recipeId: string;
}) {
  const {
    data: statistics,
    isLoading: statisticsLoading,
    error: statisticsError
  } = useQuery({
    queryKey: ["recipe-statistics", recipeId],
    queryFn: () => getRecipeStatistics(recipeId),
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const statisticsInfo = useMemo(() => [
    {
      Icon: Heart,
      iconClassName: "size-5 stroke-rose-400 fill-rose-400",
      value: statistics?.favoriteCount || 0,
      label: "Favorite",
      pluralLabel: "Favorites"
    },
    {
      Icon: ArrowDownToLine,
      iconClassName: "size-5 stroke-green-500",
      value: statistics?.savedCount || 0,
      label: "Save",
      pluralLabel: "Saves"
    },
    {
      Icon: Star,
      iconClassName: "size-5 stroke-yellow-400 fill-yellow-400",
      value: statistics?.overallRating || 0,
      label: "Star",
      pluralLabel: "Stars"
    }
  ], [statistics?.favoriteCount, statistics?.savedCount, statistics?.overallRating]);

  if (statisticsError) {
    return (
      <div className="error-label flex items-center gap-2 p-2">
        <Info size={16}/>
        There was an error while fetching recipe statistics.
      </div>
    );
  }

  if (typeof statistics === "undefined" || statisticsLoading) {
    return (
      <div className="pointer-events-none flex items-center gap-3">
        {
          Array.from({ length: 3 }, (_, i) => i).map((i) => (
            <Skeleton key={i} className="w-24 h-5 rounded-sm"/>
          ))
        }
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3",
        className
      )}
      {...props}
    >
      {
        statisticsInfo.map(({
          Icon,
          iconClassName,
          value,
          label,
          pluralLabel
        }, index) => (
          <Slot key={label}>
            <>
            <div className="font-semibold text-sm flex items-center gap-1">
              <Icon className={cn("mr-1", iconClassName)}/>
              <span className="font-semibold">{value}</span>
              <span>{value !== 1 ? pluralLabel : label}</span>
            </div>
            {index < statisticsInfo.length - 1 && <Separator orientation="vertical"/>}
            </>
          </Slot>
        ))
      }
    </div>
  );
}
