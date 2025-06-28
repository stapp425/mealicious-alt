"use client";

import { Button } from "@/components/ui/button";
import { cn, generatePagination } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

type PaginationProps = {
  pages: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

export default function Pagination({ pages, page, setPage }: PaginationProps) {
  const isFirstPage = page <= 0;
  const isLastPage = page >= pages - 1;
  
  return (
    <div className="flex items-center h-10 gap-3 mx-auto mt-auto">
      <Button
        variant="ghost"
        disabled={isFirstPage}
        onClick={() => setPage((p) => p - 1)}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        <ChevronLeft />
        <span className="hidden md:block">Previous</span>
      </Button>
      {
        generatePagination(page, pages).map((p, i) => p === "..." ? (
          <span key={i}>
            ...
          </span>
        ) : (
          <button
            key={`page-${p}`}
            onClick={() => setPage(p - 1)}
            disabled={p - 1 === page}
            className={cn(
              page === p - 1 ? "bg-mealicious-primary text-white" : "border border-foreground text-foreground",
              "cursor-pointer disabled:cursor-not-allowed text-sm h-full flex justify-center items-center min-w-6 font-semibold px-3 rounded-md transition-colors"
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
        <span className="hidden md:block">Next</span>
        <ChevronRight />
      </Button>
    </div>
  );
}
