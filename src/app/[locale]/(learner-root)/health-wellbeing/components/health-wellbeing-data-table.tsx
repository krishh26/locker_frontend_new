"use client";

import { useState, useMemo, useCallback } from "react";
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search, Download, ExternalLink, ChevronDown } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  useGetLearnerResourcesQuery,
  useTrackResourceOpenMutation,
} from "@/store/api/health-wellbeing/healthWellbeingApi";
import { toast } from "sonner";
import type { WellbeingResource } from "@/store/api/health-wellbeing/types";
import { FeedbackDialog } from "./feedback-dialog";

const feedbackDisplayMapping = {
  very_helpful: "Very Helpful",
  helpful: "Helpful",
  neutral: "Neutral",
  not_helpful: "Not Helpful",
};

export function HealthWellbeingDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedResource, setSelectedResource] = useState<WellbeingResource | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const {
    data: resourcesResponse,
    isLoading,
    error,
    refetch,
  } = useGetLearnerResourcesQuery();

  const [trackResourceOpen, { isLoading: isTracking }] = useTrackResourceOpenMutation();

  const resources = resourcesResponse?.data ?? [];

  const handleResourceAction = useCallback(
    async (resource: WellbeingResource) => {
      try {
        await trackResourceOpen({
          resourceId: resource.id,
        }).unwrap();
        window.open(resource.location, "_blank");
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "data" in error
            ? (error as { data?: { error?: string } }).data?.error
            : undefined;
        toast.error(errorMessage || "Failed to track resource access");
      }
    },
    [trackResourceOpen]
  );

  const handleOpenFeedback = useCallback((resource: WellbeingResource) => {
    setSelectedResource(resource);
    setFeedbackDialogOpen(true);
  }, []);

  const handleCloseFeedback = useCallback(() => {
    setFeedbackDialogOpen(false);
    setSelectedResource(null);
  }, []);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Never";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const columns: ColumnDef<WellbeingResource>[] = useMemo(
    () => [
      {
        accessorKey: "resource_name",
        header: "Resource Name",
        cell: ({ row }) => {
          return (
            <span className="font-semibold">{row.getValue("resource_name")}</span>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.getValue("description") as string;
          return (
            <span className="text-sm text-muted-foreground line-clamp-2 max-w-md">
              {description || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created Date",
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string;
          return (
            <span className="text-sm text-muted-foreground">
              {formatDate(date)}
            </span>
          );
        },
      },
      {
        accessorKey: "lastOpenedDate",
        header: "Last Opened",
        cell: ({ row }) => {
          const date = row.getValue("lastOpenedDate") as string | undefined;
          return (
            <span className="text-sm text-muted-foreground">
              {formatDate(date)}
            </span>
          );
        },
      },
      {
        accessorKey: "feedbacks",
        header: "Feedback",
        cell: ({ row }) => {
          const resource = row.original;
          const feedback = resource

          if (!feedback) {
            return <span className="text-sm text-muted-foreground">No feedback</span>;
          }

          return (
            <span className="text-sm">
              {feedbackDisplayMapping[feedback.feedback as unknown as keyof typeof feedbackDisplayMapping] || "Unknown"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const resource = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleResourceAction(resource)}
                disabled={isTracking}
                className="cursor-pointer"
              >
                {resource.resourceType === "FILE" ? (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Open / Download
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenFeedback(resource)}
                className="cursor-pointer"
              >
                Feedback
              </Button>
            </div>
          );
        },
      },
    ],
    [handleResourceAction, handleOpenFeedback, isTracking]
  );

  const table = useReactTable({
    data: resources,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const resource = row.original;
      const search = filterValue.toLowerCase();
      return (
        resource.resource_name.toLowerCase().includes(search) ||
        (resource.description || "").toLowerCase().includes(search) ||
        (resource.category || "").toLowerCase().includes(search)
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading resources...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive">Failed to load resources. Please try again.</div>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="text-muted-foreground text-lg">No resources available</div>
        <div className="text-muted-foreground text-sm">
          Check back later for new wellbeing resources
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="column-visibility" className="text-sm font-medium">
            Column Visibility
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild id="column-visibility">
              <Button variant="outline" className="cursor-pointer">
                Columns <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No resources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {selectedResource && (
        <FeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          resource={selectedResource}
          onSuccess={() => {
            refetch();
            handleCloseFeedback();
          }}
        />
      )}
    </div>
  );
}
