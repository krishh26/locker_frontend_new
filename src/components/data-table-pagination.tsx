"use client";

import { useId } from "react";
import { type Table } from "@tanstack/react-table";
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  // For manual pagination
  manualPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Optional: show selected rows count
  showSelectedRows?: boolean;
}

export function DataTablePagination<TData>({
  table,
  manualPagination = false,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showSelectedRows = false,
}: DataTablePaginationProps<TData>) {
  const id = useId();

  // For manual pagination, use provided values; otherwise use table state
  const page = manualPagination
    ? (currentPage ?? 1)
    : table.getState().pagination.pageIndex + 1;
  const pages = manualPagination
    ? (totalPages ?? 0)
    : table.getPageCount();
  const items = manualPagination
    ? (totalItems ?? 0)
    : table.getFilteredRowModel().rows.length;
  const currentPageSize = manualPagination
    ? (pageSize ?? 10)
    : table.getState().pagination.pageSize;

  // Calculate showing from/to for display
  const showingFrom = manualPagination
    ? ((page - 1) * currentPageSize) + 1
    : ((page - 1) * currentPageSize) + 1;
  const showingTo = manualPagination
    ? Math.min(page * currentPageSize, items)
    : Math.min(page * currentPageSize, items);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | 'ellipsis')[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    if (pages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (page <= 2) {
        // Near the beginning: show 1, 2, 3, ..., last
        for (let i = 2; i <= 3; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        // Always show last page
        pageNumbers.push(pages);
      } else if (page >= pages - 1) {
        // Near the end: show 1, ..., last-2, last-1, last
        pageNumbers.push('ellipsis');
        for (let i = pages - 2; i <= pages; i++) {
          pageNumbers.push(i);
    }
      } else {
        // In the middle: show 1, ..., current-1, current, current+1, ..., last
        pageNumbers.push('ellipsis');
        for (let i = page - 1; i <= page + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        // Always show last page
        pageNumbers.push(pages);
      }
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  const handlePageClick = (targetPage: number) => {
    if (targetPage === page || targetPage < 1 || targetPage > pages) {
      return;
    }

    if (manualPagination && onPageChange) {
      onPageChange(targetPage);
    } else {
      // For TanStack Table, we need to set the page index (0-based)
      table.setPageIndex(targetPage - 1);
    }
  };

  const handlePageSizeChange = (value: string) => {
    const newPageSize = Number(value);
    if (manualPagination && onPageSizeChange) {
      onPageSizeChange(newPageSize);
    } else {
      table.setPageSize(newPageSize);
    }
  };

  const handleFirstPage = () => {
    if (page <= 1) return;
    if (manualPagination && onPageChange) {
      onPageChange(1);
    } else {
      table.setPageIndex(0);
    }
  };

  const handleLastPage = () => {
    if (page >= pages) return;
    if (manualPagination && onPageChange) {
      onPageChange(pages);
    } else {
      table.setPageIndex(pages - 1);
    }
  };

  const handlePreviousPage = () => {
    if (manualPagination && onPageChange) {
      onPageChange(Math.max(1, page - 1));
    } else {
      table.previousPage();
    }
  };

  const handleNextPage = () => {
    if (manualPagination && onPageChange) {
      onPageChange(Math.min(pages, page + 1));
    } else {
      table.nextPage();
    }
  };

  const canPrevious = manualPagination ? page > 1 : table.getCanPreviousPage();
  const canNext = manualPagination ? page < pages : table.getCanNextPage();

  // For manual pagination, always show pagination if we have valid server metadata
  // This ensures pagination doesn't hide when client-side sorting/filtering is applied
  if (manualPagination) {
    // Show pagination if we have valid totalPages from server, or if we have items
    if (totalPages === undefined || totalPages === null) {
      // If no metadata, only show if we have items
      if (totalItems === 0 || totalItems === undefined) {
        return null;
      }
    }
    // If totalPages is 0, don't show
    if (totalPages === 0) {
      return null;
    }
  } else {
    // For automatic pagination, hide if there's only one page or no pages
    if (pages <= 1) {
      return null;
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-6 py-4 max-sm:justify-center">
      <div className="flex shrink-0 items-center gap-3">
        <Label htmlFor={id} className="text-sm font-medium">
          Rows per page
        </Label>
        <Select
          value={`${currentPageSize}`}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger id={id} className="w-fit whitespace-nowrap cursor-pointer">
            <SelectValue placeholder={currentPageSize.toString()} />
          </SelectTrigger>
          <SelectContent side="top" className="[&_*[role=option]]:pr-8 [&_*[role=option]]:pl-2 [&_*[role=option]>span]:right-2 [&_*[role=option]>span]:left-auto">
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showSelectedRows && !manualPagination && (
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      )}

      {manualPagination && (
        <div className="text-muted-foreground flex grow items-center justify-end whitespace-nowrap max-sm:justify-center">
          <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
            Showing <span className="text-foreground">{showingFrom}</span> to{" "}
            <span className="text-foreground">{showingTo}</span> of{" "}
            <span className="text-foreground">{items}</span> item(s).
          </p>
        </div>
      )}

      {!manualPagination && !showSelectedRows && (
        <div className="text-muted-foreground flex grow items-center justify-end whitespace-nowrap max-sm:justify-center">
          <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
            Showing <span className="text-foreground">{showingFrom}</span> to{" "}
            <span className="text-foreground">{showingTo}</span> of{" "}
            <span className="text-foreground">{items}</span> item(s).
          </p>
        </div>
      )}

      <Pagination className="w-fit max-sm:mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to first page"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                handleFirstPage();
              }}
              aria-disabled={!canPrevious}
              style={{ pointerEvents: !canPrevious ? 'none' : 'auto', opacity: !canPrevious ? 0.5 : 1 }}
            >
              <ChevronsLeft className="size-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to previous page"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                handlePreviousPage();
              }}
              aria-disabled={!canPrevious}
              style={{ pointerEvents: !canPrevious ? 'none' : 'auto', opacity: !canPrevious ? 0.5 : 1 }}
          >
              <ChevronLeft className="size-4" />
            </PaginationLink>
          </PaginationItem>
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === 'ellipsis') {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PaginationEllipsis />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>More pages</p>
                    </TooltipContent>
                  </Tooltip>
                </PaginationItem>
              );
            }
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href={`#${pageNum}`}
                  isActive={pageNum === page}
                  size="icon"
                  className="rounded-full"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageClick(pageNum);
                  }}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to next page"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                handleNextPage();
              }}
              aria-disabled={!canNext}
              style={{ pointerEvents: !canNext ? 'none' : 'auto', opacity: !canNext ? 0.5 : 1 }}
            >
              <ChevronRight className="size-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to last page"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                handleLastPage();
              }}
              aria-disabled={!canNext}
              style={{ pointerEvents: !canNext ? 'none' : 'auto', opacity: !canNext ? 0.5 : 1 }}
            >
              <ChevronsRight className="size-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
