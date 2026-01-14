"use client"

import { useState } from "react"
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
} from "@tanstack/react-table"
import { ChevronDown, Eye, Download, Search } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/dashboard/page-header"
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  useGetSurveyByIdQuery,
  useGetResponsesQuery,
  type Response,
} from "@/store/api/survey/surveyApi"
import { ResponseDetail } from "./response-detail"

interface ResponsesTableProps {
  surveyId: string
}

export function ResponsesTable({ surveyId }: ResponsesTableProps) {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  
  // Fetch survey from API
  const { data: surveyResponse, isLoading: isLoadingSurvey } = useGetSurveyByIdQuery(surveyId, {
    refetchOnMountOrArgChange: true,
    skip: !surveyId,
  })
  const survey = surveyResponse?.data?.survey
  
  // Fetch responses from API
  const { data: responsesResponse, isLoading: isLoadingResponses } = useGetResponsesQuery({
    surveyId,
    params: { page, limit },
  },{
    refetchOnMountOrArgChange: true,
    skip: !surveyId,
  })
  const responses = responsesResponse?.data?.responses || []
  const pagination = responsesResponse?.data?.pagination
  
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [sorting, setSorting] = useState<SortingState>([
    { id: "submittedAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  const handleViewResponse = (response: Response) => {
    setSelectedResponse(response)
    setDetailOpen(true)
  }

  const columns: ColumnDef<Response>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted Date",
      cell: ({ row }) => {
        const date = row.getValue("submittedAt") as string
        return (
          <span className="font-medium">
            {format(new Date(date), "MMM d, yyyy 'at' h:mm a")}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const response = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => handleViewResponse(response)}
            >
              <Eye className="size-4" />
              <span className="sr-only">View response</span>
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: responses,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  if (isLoadingSurvey || isLoadingResponses) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title="Loading Responses..."
          subtitle="Please wait while we load the responses"
          showBackButton
          backButtonHref="/surveys"
        />
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title="Survey Not Found"
          subtitle="The survey you're looking for doesn't exist"
          showBackButton
          backButtonHref="/surveys"
        />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title={`${survey.name} - Responses`}
          subtitle={
            pagination
              ? `${pagination.total} response${pagination.total !== 1 ? "s" : ""} received`
              : `${responses.length} response${responses.length !== 1 ? "s" : ""} received`
          }
          showBackButton
          backButtonHref="/surveys"
        />

        <div className="w-full space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search responses..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(String(event.target.value))}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="cursor-pointer">
                <Download className="mr-2 size-4" />
                Export CSV
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
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
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                No responses yet. Share the survey link to collect responses.
              </p>
            </div>
          ) : (
            <>
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
                          )
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
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination
                table={table}
                showSelectedRows={true}
              />
            </>
          )}
        </div>
      </div>

      <ResponseDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        surveyId={surveyId}
        response={selectedResponse}
      />
    </>
  )
}

