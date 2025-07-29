import { generatePagination } from "@/lib/utils";
import { parseAsIndex, useQueryState } from "nuqs";
import React from "react";

type UsePaginationProps = {
  totalPages: number;
  onSetPage?: (page: number) => void;
};

export function usePagination({ 
  totalPages,
  onSetPage
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = React.useState(0);

  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;
  const list = generatePagination(currentPage, totalPages);

  const setToPage = React.useCallback((newPage: number) => {
    const clampedPage = Math.min(Math.max(newPage, 0), totalPages - 1);
    setCurrentPage(clampedPage);
    onSetPage?.(clampedPage);
  }, [onSetPage, totalPages]);

  const incrementPage = React.useCallback(() => {
    const clampedPage = Math.min(currentPage + 1, totalPages - 1);
    setCurrentPage(clampedPage);
    onSetPage?.(clampedPage);
  }, [onSetPage, totalPages, currentPage]);

  const decrementPage = React.useCallback(() => {
    const clampedPage = Math.max(currentPage - 1, 0)
    setCurrentPage(clampedPage);
    onSetPage?.(clampedPage);
  }, [onSetPage, totalPages, currentPage]);

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

type UseQueryPaginationProps = UsePaginationProps & {
  pageParameterName?: string;
  shallow?: boolean;
};

export function useQueryPagination({ 
  totalPages,
  shallow = true,
  pageParameterName = "page",
  onSetPage
}: UseQueryPaginationProps) {
  const [currentPage, setCurrentPage] = useQueryState(
    pageParameterName,
    parseAsIndex
      .withDefault(0)
      .withOptions({ shallow })
  );

  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;
  const list = generatePagination(currentPage, totalPages);

  const setToPage = React.useCallback((newPage: number) => {
    const clampedPage = Math.min(Math.max(newPage, 0), totalPages - 1);
    setCurrentPage(clampedPage);
    onSetPage?.(clampedPage);
  }, [onSetPage, setCurrentPage, totalPages]);

  const incrementPage = React.useCallback(() => {
    const clampedPage = Math.min(currentPage + 1, totalPages - 1);
    setCurrentPage(clampedPage);
    onSetPage?.(clampedPage);
  }, [onSetPage, setCurrentPage, totalPages, currentPage]);

  const decrementPage = React.useCallback(() => {
    const clampedPage = Math.max(currentPage - 1, 0)
    setCurrentPage(clampedPage);
    onSetPage?.(clampedPage);
  }, [onSetPage, setCurrentPage, totalPages, currentPage]);

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
