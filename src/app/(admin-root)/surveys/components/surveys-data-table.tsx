"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  FileText,
  FileDown,
  ExternalLink,
  MoreVertical,
} from "lucide-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SurveyForm } from "./survey-form"
import { AllocateSurveyDialog } from "./allocate-survey-dialog"
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  useGetSurveysQuery,
  useDeleteSurveyMutation,
  type Survey,
  type SurveyStatus,
} from "@/store/api/survey/surveyApi"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"

export function SurveysDataTable() {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null)
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)
  const [surveyToAllocate, setSurveyToAllocate] = useState<Survey | null>(null)
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | "">("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  // API hooks
  const { data: surveysResponse, isLoading, error } = useGetSurveysQuery({
    status: statusFilter || undefined,
    page,
    limit,
    search: searchQuery || undefined,
  },{
    refetchOnMountOrArgChange: true,
  })
  const [deleteSurvey, { isLoading: isDeleting }] = useDeleteSurveyMutation()

  // Memoize surveys to prevent dependency issues
  const surveys = useMemo(() => surveysResponse?.data?.surveys || [], [surveysResponse?.data?.surveys])
  const pagination = surveysResponse?.data?.pagination

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "Published":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      case "Draft":
        return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
      case "Archived":
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }, [])

  const exactFilter = useCallback((row: Row<Survey>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }, [])

  const handleDelete = useCallback((id: string) => {
    setSurveyToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (surveyToDelete) {
      try {
        await deleteSurvey(surveyToDelete).unwrap()
        toast.success("Survey deleted successfully")
        setDeleteDialogOpen(false)
        setSurveyToDelete(null)
      } catch (error: unknown) {
        // Handle RTK Query error format
        // Error structure: { status: 403, data: { message: "...", status: false } }
        let errorMessage = "Failed to delete survey"
        
        if (error && typeof error === 'object' && 'data' in error) {
          const errorData = error.data
          if (errorData && typeof errorData === 'object' && 'message' in errorData) {
            errorMessage = String(errorData.message)
          }
        }
        
        toast.error(errorMessage)
      }
    }
  }, [surveyToDelete, deleteSurvey])

  const handleEdit = useCallback((survey: Survey) => {
    setEditingSurvey(survey)
    setFormOpen(true)
  }, [])

  const handleAdd = useCallback(() => {
    setEditingSurvey(null)
    setFormOpen(true)
  }, [])

  const handleView = useCallback((surveyId: string) => {
    router.push(`/surveys/${surveyId}/builder`)
  }, [router])

  const columns: ColumnDef<Survey>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const survey = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{survey.name}</span>
            {survey.description && (
              <span className="text-sm text-muted-foreground line-clamp-1">
                {survey.description}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={getStatusColor(status)}>
            {status}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      accessorKey: "totalQuestions",
      header: "Questions",
      cell: ({ row }) => {
        const count = (row.getValue("totalQuestions") as number | undefined) ?? 0
        return <span className="font-medium">{count}</span>
      },
    },
    {
      accessorKey: "totalResponses",
      header: "Responses",
      cell: ({ row }) => {
        const count = (row.getValue("totalResponses") as number | undefined) ?? 0
        return <span className="font-medium">{count}</span>
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string
        return (
          <span className="text-sm">
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        )
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as string
        return (
          <span className="text-sm">
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const survey = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => handleView(survey.id)}
            >
              <Eye className="size-4" />
              <span className="sr-only">View survey</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => handleEdit(survey)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit survey</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push(`/surveys/${survey.id}/responses`)}
                >
                  <FileText className="mr-2 size-4" />
                  View Responses
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    const formUrl = `/survey/${survey.id}`
                    window.open(formUrl, "_blank")
                  }}
                >
                  <ExternalLink className="mr-2 size-4" />
                  Open Public Form
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setSurveyToAllocate(survey)
                    setAllocateDialogOpen(true)
                  }}
                >
                  <UserPlus className="mr-2 size-4" />
                  Allocate Form
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <FileDown className="mr-2 size-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <FileDown className="mr-2 size-4" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => handleDelete(survey.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Survey
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [getStatusColor, handleView, handleEdit, handleDelete, exactFilter, router])

  const table = useReactTable({
    data: surveys,
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


  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search surveys..."
                value={globalFilter ?? ""}
                onChange={(event) => {
                  setGlobalFilter(String(event.target.value))
                  setSearchQuery(String(event.target.value))
                  setPage(1) // Reset to first page on search
                }}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                  <Download className="mr-2 size-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <FileDown className="mr-2 size-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <FileDown className="mr-2 size-4" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
            <SurveyForm
              open={formOpen}
              onOpenChange={setFormOpen}
              survey={editingSurvey}
            />
            <Button className="cursor-pointer" onClick={handleAdd}>
              Create Survey
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium">
              Status
            </Label>
            <Select
              value={statusFilter || ""}
              onValueChange={(value) => {
                const newStatus = value === "all" ? "" : (value as SurveyStatus | "")
                setStatusFilter(newStatus)
                table.getColumn("status")?.setFilterValue(newStatus)
                setPage(1) // Reset to first page on filter change
              }}
            >
              <SelectTrigger className="cursor-pointer w-full" id="status-filter">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="column-visibility" className="text-sm font-medium">
              Column Visibility
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild id="column-visibility">
                <Button variant="outline" className="cursor-pointer w-full">
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
          </div> */}
        </div>

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
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Loading surveys...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Error loading surveys. Please try again.
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
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
          manualPagination={true}
          currentPage={page}
          totalPages={pagination?.totalPages || 1}
          totalItems={pagination?.total || 0}
          pageSize={limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the survey
              and all its questions and responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AllocateSurveyDialog
        open={allocateDialogOpen}
        onOpenChange={setAllocateDialogOpen}
        survey={surveyToAllocate}
      />
    </>
  )
}

