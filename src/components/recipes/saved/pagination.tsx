"use client";

import { Button } from "@/components/ui/button";
import { useQueryPagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  totalPages: number;
};

export default function Pagination({ totalPages }: PaginationProps) {
  const {
    currentPage,
    isFirstPage,
    isLastPage,
    setToPage,
    incrementPage,
    decrementPage,
    list: paginationList
  } = useQueryPagination({
    totalPages,
    shallow: false
  });
  
  return (
    <div className="flex items-end h-10 gap-3 mx-auto mt-4">
      <Button
        variant="ghost"
        disabled={isFirstPage}
        onClick={decrementPage}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        <ChevronLeft />
      </Button>
      {
        paginationList.map((p, i) => p === "..." ? (
          <span key={i} className="text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={`page-${p}`}
            onClick={() => setToPage(p - 1)}
            disabled={p - 1 === currentPage}
            className={cn(
              p - 1 === currentPage ? "border-mealicious-primary bg-mealicious-primary text-white" : "border-secondary-foreground text-secondary-foreground",
              "border cursor-pointer disabled:cursor-not-allowed text-sm h-full flex justify-center items-center min-w-6 font-semibold px-3 rounded-sm transition-colors"
            )}
          >
            {p}
          </button>
        ))
      }
      <Button
        variant="ghost"
        disabled={isLastPage}
        onClick={incrementPage}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
