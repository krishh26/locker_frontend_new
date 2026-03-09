"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "@/i18n/navigation"
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
  useAllocateSurveyMutation,
  type Survey,
  type SurveyStatus,
  type AllocationRole,
} from "@/store/api/survey/surveyApi"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { useAppSelector } from "@/store/hooks"
import { useTranslations } from "next-intl"

export function SurveysDataTable() {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)
  const userRole = user?.role
  const isEmployer = userRole === "Employer"
  const t = useTranslations("surveys")
  const tCommon = useTranslations("common")
  
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
  const [allocateSurvey] = useAllocateSurveyMutation()

  // Memoize surveys to prevent dependency issues
  const surveys = useMemo(() => surveysResponse?.data?.surveys || [], [surveysResponse?.data?.surveys])
  const pagination = surveysResponse?.data?.pagination

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "Published":
        return "text-white bg-accent border-accent"
      case "Draft":
        return "text-white bg-secondary border-secondary"
      case "Archived":
        return "text-muted-foreground bg-muted border-border"
      default:
        return "text-muted-foreground bg-muted border-border"
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
        toast.success(t("toast.deleteSuccess"))
        setDeleteDialogOpen(false)
        setSurveyToDelete(null)
      } catch (error: unknown) {
        // Handle RTK Query error format
        // Error structure: { status: 403, data: { message: "...", status: false } }
        let errorMessage = t("toast.deleteFailed")
        
        if (error && typeof error === 'object' && 'data' in error) {
          const errorData = error.data
          if (errorData && typeof errorData === 'object' && 'message' in errorData) {
            errorMessage = String(errorData.message)
          }
        }
        
        toast.error(errorMessage)
      }
    }
  }, [surveyToDelete, deleteSurvey, t])

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

  const handleAllocate = useCallback(
    async (
      allocations: Array<{
        user_id: number
        role: AllocationRole
        user_type: "user" | "learner"
      }>
    ) => {
      if (!surveyToAllocate) {
        toast.error(t("toast.allocateSelectSurvey"))
        return
      }

      try {
        // Map UI roles (AllocationRole) to API roles (lowercase)
        const roleMapping: Record<AllocationRole, string> = {
          Trainer: "trainer",
          IQA: "iqa",
          Learner: "learner",
          EQA: "eqa",
        }

        const apiAllocations = allocations.map((allocation) => ({
          user_id: allocation.user_id,
          role: roleMapping[allocation.role],
          user_type: allocation.user_type,
        }))

        const response = await allocateSurvey({
          survey_id: surveyToAllocate.id,
          // Cast here because the backend expects lowercase roles while
          // AllocationRole is defined with capitalized variants for the UI.
          allocations: apiAllocations as unknown as typeof allocations,
        }).unwrap()

        const allocatedCount = response.data?.allocated_count ?? allocations.length
        toast.success(t("toast.allocateSuccess", { count: allocatedCount }))
        setAllocateDialogOpen(false)
      } catch (error: unknown) {
        const typedError = error as {
          data?: { error?: { message?: string }; message?: string | Array<{ field: string; message: string }> }
          message?: string
        }

        let message: string

        // Handle array of field errors (e.g. Zod validation errors)
        if (Array.isArray(typedError.data?.message) && typedError.data.message.length > 0) {
          message = typedError.data.message[0]?.message ?? t("toast.allocateFailed")
        } else {
          message =
            typedError.data?.error?.message ||
            (typeof typedError.data?.message === "string" ? typedError.data.message : undefined) ||
            typedError.message ||
            t("toast.allocateFailed")
        }

        toast.error(message)
      }
    },
    [allocateSurvey, surveyToAllocate, t]
  )

  const columns: ColumnDef<Survey>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: t("table.headers.name"),
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
      header: t("table.headers.status"),
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
      header: t("table.headers.questions"),
      cell: ({ row }) => {
        const count = (row.getValue("totalQuestions") as number | undefined) ?? 0
        return <span className="font-medium">{count}</span>
      },
    },
    {
      accessorKey: "totalResponses",
      header: t("table.headers.responses"),
      cell: ({ row }) => {
        const count = (row.getValue("totalResponses") as number | undefined) ?? 0
        return <span className="font-medium">{count}</span>
      },
    },
    {
      accessorKey: "createdAt",
      header: t("table.headers.created"),
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
      header: t("table.headers.updated"),
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
      header: t("table.headers.actions"),
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
                  <span className="sr-only">{t("table.actions.viewSurvey")}</span>
                </Button>
              {!isEmployer && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => handleEdit(survey)}
                >
                  <Pencil className="size-4" />
                  <span className="sr-only">{t("table.actions.editSurvey")}</span>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">{t("table.actions.more")}</span>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push(`/surveys/${survey.id}/responses`)}
                >
                  <FileText className="mr-2 size-4" />
                  {t("table.actions.viewResponses")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    const formUrl = `/survey/${survey.id}`
                    window.open(formUrl, "_blank")
                  }}
                >
                  <ExternalLink className="mr-2 size-4" />
                  {t("table.actions.openPublicForm")}
                </DropdownMenuItem>
                {!isEmployer && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setSurveyToAllocate(survey)
                        setAllocateDialogOpen(true)
                      }}
                    >
                      <UserPlus className="mr-2 size-4" />
                      {t("table.actions.allocateSurvey")}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <FileDown className="mr-2 size-4" />
                  {t("table.actions.exportCsv")}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <FileDown className="mr-2 size-4" />
                  {t("table.actions.exportPdf")}
                </DropdownMenuItem>
                {!isEmployer && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => handleDelete(survey.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t("table.actions.deleteSurvey")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [getStatusColor, handleView, handleEdit, handleDelete, exactFilter, router, isEmployer, t])

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
                placeholder={t("table.searchPlaceholder")}
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
            {!isEmployer && (
              <Button className="cursor-pointer" onClick={handleAdd}>
                {t("table.createButton")}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4 rounded-lg border p-4 border-border">
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium">
              {t("filters.statusLabel")}
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
                <SelectValue placeholder={t("filters.statusPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.statusAll")}</SelectItem>
                <SelectItem value="Draft">{t("status.Draft")}</SelectItem>
                <SelectItem value="Published">{t("status.Published")}</SelectItem>
                <SelectItem value="Archived">{t("status.Archived")}</SelectItem>
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
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t("table.loading")}
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t("table.error")}
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
                    {t("table.noResults")}
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
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("deleteDialog.deleting") : tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AllocateSurveyDialog
        open={allocateDialogOpen}
        onOpenChange={setAllocateDialogOpen}
        survey={surveyToAllocate}
        onAllocate={handleAllocate}
      />
    </>
  )
}

