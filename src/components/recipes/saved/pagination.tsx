"use client";

import { Button } from "@/components/ui/button";
import { cn, generatePagination } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseAsIndex, useQueryState } from "nuqs";
import { useMediaQuery } from "usehooks-ts";

type PaginationProps = {
  pages: number;
};

export default function Pagination({ pages }: PaginationProps) {
  const matches = useMediaQuery("(min-width: 48rem)");
  const [page, setPage] = useQueryState(
    "page",
    parseAsIndex
      .withDefault(0)
      .withOptions({
        shallow: false
      })
  );

  const isFirstPage = page <= 0;
  const isLastPage = page >= pages - 1;
  
  return (
    <div className="flex items-center h-12 gap-3 mx-auto mt-auto">
      <Button
        variant="ghost"
        disabled={isFirstPage}
        onClick={() => setPage((p) => p - 1)}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        <ChevronLeft />
        {matches && "Previous"}
      </Button>
      {
        generatePagination(page, pages).map((p, i) => p === "..." ? (
          <span key={i + 1}>
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p - 1)}
            disabled={p - 1 === page}
            className={cn(
              page === p - 1 ? "bg-mealicious-primary text-white" : "border border-foreground text-foreground",
              "cursor-pointer disabled:cursor-not-allowed h-full flex justify-center items-center min-w-10 font-semibold px-3 rounded-md transition-colors"
            )}
          >
            {p}
          </button>
        ))
      }
      <Button
        variant="ghost"
        disabled={isLastPage}
        onClick={() => setPage((p) => p + 1)}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        {matches && "Next"}
        <ChevronRight />
      </Button>
    </div>
  );
}
