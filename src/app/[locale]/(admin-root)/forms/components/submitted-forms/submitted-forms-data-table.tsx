"use client"

import { useState, useMemo } from "react"
import { useRouter } from "@/i18n/navigation"
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
import {
  Eye,
  Lock,
  LockOpen,
  Download,
  Search,
  X,
} from "lucide-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  useGetAllSubmittedFormsQuery,
  useLockFormMutation,
  useUnlockFormMutation,
} from "@/store/api/forms/formsApi"
import { toast } from "sonner"
import { FormsLockDialog } from "./forms-lock-dialog"
import { FormsUnlockDialog } from "./forms-unlock-dialog"
import type { SubmittedForm } from "@/store/api/forms/types"
import { DataTablePagination } from "@/components/data-table-pagination"

export function SubmittedFormsDataTable() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<SubmittedForm | null>(null)

  const {
    data: formsData,
    isLoading,
    refetch,
  } = useGetAllSubmittedFormsQuery({
    page,
    page_size: pageSize,
    search_keyword: searchKeyword,
  }, {
    // Refetch when page or pageSize changes
    refetchOnMountOrArgChange: true,
  })

  const [lockForm, { isLoading: isLocking }] = useLockFormMutation()
  const [unlockForm, { isLoading: isUnlocking }] = useUnlockFormMutation()

  const router = useRouter()

  const handleView = (row: SubmittedForm) => {
    router.push(`/forms/submitted/${row.form.id}/${row.user.user_id}/view`)
  }

  const handleLockClick = (row: SubmittedForm) => {
    setSelectedForm(row)
    setLockDialogOpen(true)
  }

  const handleUnlockClick = (row: SubmittedForm) => {
    setSelectedForm(row)
    setUnlockDialogOpen(true)
  }

  const handleLockConfirm = async (reason: string) => {
    if (!selectedForm) return

    try {
      await lockForm({
        formId: selectedForm.form.id,
        userId: selectedForm.user.user_id,
        reason,
      }).unwrap()
      toast.success("Form locked successfully!")
      setLockDialogOpen(false)
      setSelectedForm(null)
      refetch()
    } catch {
      toast.error("Failed to lock form. Please try again.")
    }
  }

  const handleUnlockConfirm = async (reason: string) => {
    if (!selectedForm) return

    try {
      await unlockForm({
        formId: selectedForm.form.id,
        userId: selectedForm.user.user_id,
        reason,
      }).unwrap()
      toast.success("Form unlocked successfully!")
      setUnlockDialogOpen(false)
      setSelectedForm(null)
      refetch()
    } catch {
      toast.error("Failed to unlock form. Please try again.")
    }
  }

  const handleSearch = () => {
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchKeyword("")
    setPage(1)
  }

  const formatDate = (date: string) => {
    if (!date) return ""
    return format(new Date(date), "dd MMM yyyy")
  }

  const columns: ColumnDef<SubmittedForm>[] = useMemo(
    () => [
      {
        accessorKey: "form.form_name",
        header: "Form Name",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.form.form_name}</div>
        ),
      },
      {
        accessorKey: "form.type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.form.type}</Badge>
        ),
      },
      {
        accessorKey: "user.user_name",
        header: "User Name",
        cell: ({ row }) => row.original.user.user_name,
      },
      {
        accessorKey: "user.email",
        header: "Email",
        cell: ({ row }) => row.original.user.email,
      },
      {
        accessorKey: "is_locked",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.is_locked ? "destructive" : "default"}
            className="gap-1"
          >
            {row.original.is_locked ? (
              <>
                <Lock className="h-3 w-3" />
                Locked
              </>
            ) : (
              <>
                <LockOpen className="h-3 w-3" />
                Unlocked
              </>
            )}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Submit Date",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleView(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!row.original.is_locked && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-secondary hover:text-secondary/90"
                onClick={() => handleLockClick(row.original)}
              >
                <Lock className="h-4 w-4" />
              </Button>
            )}
            {row.original.is_locked && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-accent hover:text-accent/90"
                onClick={() => handleUnlockClick(row.original)}
              >
                <LockOpen className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: formsData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    // For manual pagination, sorting should be done server-side
    // But we can still allow client-side sorting for the current page
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    manualPagination: true,
    manualSorting: false, // Allow client-side sorting on current page
    manualFiltering: false, // Allow client-side filtering on current page
    pageCount: formsData?.meta_data?.pages || 0,
  })

  const handleExportCSV = () => {
    const data = formsData?.data || []
    const headers = [
      "Form Name",
      "Type",
      "User Name",
      "Email",
      "Status",
      "Submit Date",
    ]
    const rows = data.map((form) => [
      form.form.form_name,
      form.form.type,
      form.user.user_name,
      form.user.email,
      form.is_locked ? "Locked" : "Unlocked",
      formatDate(form.created_at),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `submitted-forms-${format(new Date(), "yyyy-MM-dd")}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV exported successfully")
  }

  return (
    <div className="space-y-4">
      {/* Search and Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by form name, user, or email..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 pr-9"
          />
          {searchKeyword && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                  Loading...
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
                  No forms found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
        <DataTablePagination
          table={table}
          manualPagination={true}
          currentPage={page}
          totalPages={formsData?.meta_data?.pages || 0}
          totalItems={formsData?.meta_data?.items || 0}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

      {/* Lock Dialog */}
      <FormsLockDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        form={selectedForm}
        onConfirm={handleLockConfirm}
        isLoading={isLocking}
      />

      {/* Unlock Dialog */}
      <FormsUnlockDialog
        open={unlockDialogOpen}
        onOpenChange={setUnlockDialogOpen}
        form={selectedForm}
        onConfirm={handleUnlockConfirm}
        isLoading={isUnlocking}
      />
    </div>
  )
}
