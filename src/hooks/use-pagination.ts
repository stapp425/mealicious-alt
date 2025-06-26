import { generatePagination } from "@/lib/utils";
import { parseAsIndex, useQueryState } from "nuqs";
import { useCallback, useState } from "react";

export function usePagination(totalPages: number) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;
  const list = generatePagination(currentPage, totalPages);

  const setToPage = useCallback((newPage: number) => {
    setCurrentPage(Math.min(Math.max(newPage, 0), totalPages))
  }, [totalPages]);

  const incrementPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const decrementPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  }, []);

  return {
    isFirstPage,
    isLastPage,
    currentPage,
    setToPage,
    incrementPage,
    decrementPage,
    list
  };
}

export function useQueryPagination(totalPages: number) {
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsIndex
      .withDefault(0)
      .withOptions({
        shallow: false
      }),
  );
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;
  const list = generatePagination(currentPage, totalPages);

  const setToPage = useCallback((newPage: number) => {
    setCurrentPage(Math.min(Math.max(newPage, 0), totalPages))
  }, [totalPages]);

  const incrementPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const decrementPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  }, []);

  return {
    isFirstPage,
    isLastPage,
    currentPage,
    setToPage,
    incrementPage,
    decrementPage,
    list
  };
}
