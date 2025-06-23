import { generatePagination } from "@/lib/utils";
import { parseAsIndex, useQueryState } from "nuqs";
import { useCallback, useState } from "react";

type UsePaginationProps = {
  totalPages: number;
};

export function usePagination({ totalPages }: UsePaginationProps) {
  const [page, setPage] = useState<number>(0);
  const isFirstPage = page <= 0;
  const isLastPage = page >= totalPages - 1;
  const list = generatePagination(page, totalPages);

  const setToPage = useCallback((newPage: number) => {
    setPage(Math.min(Math.max(newPage, 0), totalPages))
  }, [totalPages]);

  const incrementPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const decrementPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 0));
  }, []);

  return {
    isFirstPage,
    isLastPage,
    page,
    setToPage,
    incrementPage,
    decrementPage,
    list
  };
}

export function useQueryPagination({ totalPages }: UsePaginationProps) {
  const [page, setPage] = useQueryState(
    "page",
    parseAsIndex
      .withDefault(0)
      .withOptions({
        shallow: false,
        throttleMs: 500
      })
  );
  const isFirstPage = page <= 0;
  const isLastPage = page >= totalPages - 1;
  const list = generatePagination(page, totalPages);

  const setToPage = useCallback((newPage: number) => {
    setPage(Math.min(Math.max(newPage, 0), totalPages))
  }, [totalPages]);

  const incrementPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const decrementPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 0));
  }, []);

  return {
    isFirstPage,
    isLastPage,
    page,
    setToPage,
    incrementPage,
    decrementPage,
    list
  };
}
