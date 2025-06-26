"use client";

import { Button } from "@/components/ui/button";
import { useQueryPagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  totalPages: number;
};

export default function Pagination({ totalPages }: PaginationProps) {
  const pagination = useQueryPagination(totalPages);

  return (
    <div className="flex items-center h-12 gap-3 mx-auto mt-auto">
      <Button
        variant="ghost"
        disabled={pagination.isFirstPage}
        onClick={pagination.decrementPage}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        <ChevronLeft />
        <span className="hidden md:block">Previous</span>
      </Button>
      {
        pagination.list.map((p, i) => p === "..." ? (
          <span key={i}>
            ...
          </span>
        ) : (
          <button
            key={`page-${p}`}
            onClick={() => pagination.setToPage(p - 1)}
            disabled={p - 1 === pagination.currentPage}
            className={cn(
              pagination.currentPage === p - 1 ? "bg-mealicious-primary text-white" : "border border-foreground text-foreground",
              "cursor-pointer disabled:cursor-not-allowed h-full flex justify-center items-center min-w-10 font-semibold px-3 rounded-md transition-colors"
            )}
          >
            {p}
          </button>
        ))
      }
      <Button
        variant="ghost"
        disabled={pagination.isLastPage}
        onClick={pagination.incrementPage}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        <span className="hidden md:block">Next</span>
        <ChevronRight />
      </Button>
    </div>
  );
}
