"use client";

import { useState, useMemo, useCallback } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Plus,
  Search,
} from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import type { Unit } from "@/store/api/units/types";

type FormValues = {
  selectedUnitIds: string[];
};

interface ChooseUnitsDataTableProps {
  units: Unit[];
  mandatoryUnitIds: string[];
}

function getTypeColor(mandatory: boolean) {
  return mandatory
    ? "text-white bg-primary"
    : "text-muted-foreground bg-muted";
}

export function ChooseUnitsDataTable({
  units,
  mandatoryUnitIds,
}: ChooseUnitsDataTableProps) {
  const { control, watch } = useFormContext<FormValues>();
  const selectedUnitIds = watch("selectedUnitIds");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());

  const handleExportCsv = () => {
    toast.info("CSV export functionality will be implemented");
  };

  const handleExportPdf = () => {
    toast.info("PDF export functionality will be implemented");
  };

  const handleAddNew = () => {
    toast.info("Add New functionality will be implemented");
  };

  const toggleUnitExpansion = useCallback((unitId: number) => {
    setExpandedUnits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  }, []);

  const columns: ColumnDef<Unit>[] = useMemo(
    () => [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-center px-2">
            <span className="text-sm font-medium">Select</span>
          </div>
        ),
        cell: ({ row }) => {
          const unit = row.original;
          const unitIdString = String(unit.id);
          const isMandatory = mandatoryUnitIds.includes(unitIdString);
          const isChecked = selectedUnitIds.includes(unitIdString);

          return (
            <div className="flex items-center justify-center px-2">
              <Controller
                control={control}
                name="selectedUnitIds"
                render={({ field }) => {
                  const handleCheckedChange = (checked: boolean) => {
                    if (isMandatory) {
                      return; // Mandatory units cannot be deselected
                    }
                    const currentIds = field.value || [];
                    if (checked) {
                      field.onChange([...currentIds, unitIdString]);
                    } else {
                      field.onChange(currentIds.filter((id) => id !== unitIdString));
                    }
                  };

                  return (
                    <Checkbox
                      checked={isChecked}
                      disabled={isMandatory}
                      onCheckedChange={handleCheckedChange}
                      aria-label={`Select ${unit.title}`}
                    />
                  );
                }}
              />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 80,
      },
      {
        accessorKey: "title",
        header: "Unit Name",
        cell: ({ row }) => {
          const unit = row.original;
          const isExpanded = expandedUnits.has(unit.id);
          const hasSubUnits = unit.subUnit && unit.subUnit.length > 0;

          return (
            <div className="flex items-center gap-2">
              {hasSubUnits && (
                <button
                  type="button"
                  onClick={() => toggleUnitExpansion(unit.id)}
                  className="flex items-center justify-center p-1 hover:bg-accent rounded transition-colors cursor-pointer"
                  aria-label={isExpanded ? "Collapse unit" : "Expand unit"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )}
              <span className="font-medium">{unit.title}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "mandatory",
        header: "Type",
        cell: ({ row }) => {
          const unit = row.original;
          return (
            <Badge
              variant="secondary"
              className={getTypeColor(unit.mandatory)}
            >
              {unit.mandatory ? "Mandatory" : "Optional"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "glh",
        header: "GLH",
        cell: ({ row }) => {
          const glh = row.getValue("glh") as number;
          return <span className="text-sm">{glh || 0}</span>;
        },
      },
      {
        accessorKey: "level",
        header: "Level",
        cell: ({ row }) => {
          const level = row.getValue("level") as string;
          return <span className="text-sm">{level || "-"}</span>;
        },
      },
      {
        accessorKey: "credit_value",
        header: "Credits",
        cell: ({ row }) => {
          const credits = row.getValue("credit_value") as number;
          return <span className="text-sm font-medium">{credits || 0}</span>;
        },
      },
    ],
    [control, mandatoryUnitIds, selectedUnitIds, expandedUnits, toggleUnitExpansion]
  );

  const table = useReactTable({
    data: units,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Download className="mr-2 size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={handleAddNew}
            disabled
            className="cursor-pointer"
          >
            <Plus className="mr-2 size-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Column Visibility Toggle */}
      <div className="flex items-center space-x-2">
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
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === "mandatory" ? "Type" : column.id === "credit_value" ? "Credits" : column.id}
                    </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
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
              table.getRowModel().rows.flatMap((row) => {
                const unit = row.original;
                const isExpanded = expandedUnits.has(unit.id);
                const hasSubUnits = unit.subUnit && unit.subUnit.length > 0;

                const rows = [
                  <TableRow
                    key={unit.id}
                    data-state={selectedUnitIds.includes(String(unit.id)) && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>,
                ];

                if (isExpanded && hasSubUnits) {
                  // Flatten all topics from all subUnits
                  const allTopics = unit.subUnit?.flatMap((subUnit) => 
                    subUnit.topics?.map((topic) => topic) || []
                  ) || [];

                  rows.push(
                    <TableRow key={`${unit.id}-expanded`}>
                      <TableCell colSpan={columns.length} className="p-0">
                        <div className="p-4 space-y-2">
                          {allTopics.map((topic) => (
                            <div
                              key={topic.id}
                              className="flex items-start gap-2 text-sm py-1 border-l-2 border-primary/20 pl-4"
                            >
                              <span className="text-muted-foreground font-mono text-xs min-w-12">
                                {topic.code}
                              </span>
                              <div className="flex-1">
                                <span className="text-foreground">{topic.title}</span>
                                {topic.type && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    {topic.type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {allTopics.length === 0 && (
                            <div className="text-sm text-muted-foreground py-2">
                              No topics available
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return rows;
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} showSelectedRows={false} />
    </div>
  );
}

