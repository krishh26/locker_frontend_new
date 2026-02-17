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
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Eye, Download, Search, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
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
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  useGetSurveyByIdQuery,
  useGetResponsesQuery,
  useGetQuestionsQuery,
  type Response,
} from "@/store/api/survey/surveyApi"
import { toast } from "sonner"
import { ResponseDetail } from "./response-detail"

interface ResponsesTableProps {
  surveyId: string
}

export function ResponsesTable({ surveyId }: ResponsesTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Fetch survey from API
  const { data: surveyResponse, isLoading: isLoadingSurvey } = useGetSurveyByIdQuery(surveyId, {
    refetchOnMountOrArgChange: true,
    skip: !surveyId,
  })
  const survey = surveyResponse?.data?.survey
  
  // Fetch responses from API with pagination
  const { data: responsesResponse, isLoading: isLoadingResponses } = useGetResponsesQuery({
    surveyId,
    params: { page, limit: pageSize },
  },{
    refetchOnMountOrArgChange: true,
    skip: !surveyId,
  })
  const responses = responsesResponse?.data?.responses || []
  const pagination = responsesResponse?.data?.pagination
  
  // Fetch questions for CSV export
  const { data: questionsResponse } = useGetQuestionsQuery(surveyId, {
    refetchOnMountOrArgChange: true,
    skip: !surveyId,
  })
  const questions = questionsResponse?.data?.questions || []

  // Fetch all responses for CSV export (high limit)
  const { data: allResponsesResponse } = useGetResponsesQuery(
    {
      surveyId,
      params: { page: 1, limit: 1000 },
    },
    {
      refetchOnMountOrArgChange: false,
      skip: !surveyId,
    }
  )
  const allResponses = allResponsesResponse?.data?.responses || []

  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [sorting, setSorting] = useState<SortingState>([
    { id: "submittedAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")

  const handleViewResponse = (response: Response) => {
    setSelectedResponse(response)
    setDetailOpen(true)
  }

  const formatAnswerForCSV = (
    answer: string | string[] | Record<string, string> | null | undefined,
    questionType: string
  ): string => {
    if (answer === null || answer === undefined) {
      return ""
    }

    if (typeof answer === "string") {
      // Handle date strings
      if (questionType === "date") {
        try {
          return format(new Date(answer), "yyyy-MM-dd")
        } catch {
          return answer
        }
      }
      return answer.replace(/"/g, '""') // Escape quotes for CSV
    }

    if (Array.isArray(answer)) {
      return answer.join("; ").replace(/"/g, '""')
    }

    if (typeof answer === "object") {
      // Likert scale responses
      return Object.entries(answer)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ")
        .replace(/"/g, '""')
    }

    return String(answer).replace(/"/g, '""')
  }

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)

      // Sort questions by order
      const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

      // Create CSV headers
      const headers = [
        "Response ID",
        "Submitted Date",
        "Email",
        "User ID",
        ...sortedQuestions.map((q) => q.title),
      ]

      // Create CSV rows
      const rows = allResponses.map((response) => {
        const row = [
          response.id,
          format(new Date(response.submittedAt), "yyyy-MM-dd HH:mm:ss"),
          response.email || "",
          response.userId || "",
          ...sortedQuestions.map((question) => {
            const answer = response.answers[question.id]
            return formatAnswerForCSV(answer, question.type)
          }),
        ]
        return row
      })

      // Combine headers and rows
      const csvContent = [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n")

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `${survey?.name || "survey"}_responses_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`
      )
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      toast.success(`Exported ${allResponses.length} response(s) to CSV`)
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast.error("Failed to export CSV")
    } finally {
      setIsExporting(false)
    }
  }

  const columns: ColumnDef<Response>[] = [
    {
      id: "rowNumber",
      header: "#",
      cell: ({ row, table }) => {
        const pageIndex = table.getState().pagination.pageIndex
        const pageSize = table.getState().pagination.pageSize
        const rowNumber = pageIndex * pageSize + row.index + 1
        return (
          <div className="flex">
            <span className="text-sm text-muted-foreground font-medium">{rowNumber}</span>
          </div>
        )
      },
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
    manualPagination: true,
    pageCount: pagination?.totalPages ?? 0,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize,
      },
    },
  })

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }

  if (isLoadingSurvey || isLoadingResponses) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading responses...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Survey not found</p>
      </div>
    )
  }

  return (
    <>
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
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={handleExportCSV}
                disabled={isExporting || allResponses.length === 0}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 size-4" />
                    Export CSV
                  </>
                )}
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
            <div className="rounded-xl border border-dashed border-primary p-12 text-center bg-muted">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive border-destructive flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-white" />
              </div>
              <p className="text-muted-foreground">
                No responses yet. Share the survey link to collect responses.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-x-auto shadow-sm">
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
                showSelectedRows={false}
                manualPagination={true}
                currentPage={page}
                totalPages={pagination?.totalPages ?? 0}
                totalItems={pagination?.total ?? 0}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
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

