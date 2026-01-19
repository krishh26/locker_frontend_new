"use client"

import { useState, useMemo, useCallback } from "react"
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
  Pencil,
  Trash2,
  Download,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { format } from "date-fns"

import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useGetSupportListQuery,
  useDeleteSupportMutation,
} from "@/store/api/support/supportApi"
import { toast } from "sonner"
import { DataTablePagination } from "@/components/data-table-pagination"
import { useAppSelector } from "@/store/hooks"
import type { Support } from "@/store/api/support/types"
import { SupportDeleteDialog } from "./support-delete-dialog"
import { SupportAddEditDialog } from "./support-add-edit-dialog"
import { VariantProps } from "class-variance-authority"

export function SupportDataTable() {
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === "Admin"

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false)
  const [selectedSupport, setSelectedSupport] = useState<Support | null>(null)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")

  // For non-admin users, filter by their user_id
  const userId: number | undefined = !isAdmin && user?.user_id
    ? (typeof user.user_id === 'number' ? user.user_id : parseInt(String(user.user_id)))
    : undefined

  const {
    data: supportData,
    isLoading,
    refetch,
  } = useGetSupportListQuery({
    page,
    page_size: pageSize,
    userId,
  }, {
    refetchOnMountOrArgChange: true,
  })

  const [deleteSupport, { isLoading: isDeleting }] = useDeleteSupportMutation()

  const handleEdit = useCallback((row: Support) => {
    setSelectedSupport(row)
    setDialogMode("edit")
    setAddEditDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((row: Support) => {
    setSelectedSupport(row)
    setDeleteDialogOpen(true)
  }, [])

  const handleAddClick = useCallback(() => {
    setSelectedSupport(null)
    setDialogMode("add")
    setAddEditDialogOpen(true)
  }, [])

  const handleDeleteConfirm = async () => {
    if (!selectedSupport) return

    try {
      await deleteSupport({ support_id: selectedSupport.support_id }).unwrap()
      toast.success("Support request deleted successfully!")
      setDeleteDialogOpen(false)
      setSelectedSupport(null)
      refetch()
    } catch {
      toast.error("Failed to delete support request. Please try again.")
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const formatDate = (date: string) => {
    if (!date) return ""
    return format(new Date(date), "dd MMM yyyy")
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Pending":
        return "secondary"
      case "InProgress":
        return "default"
      case "Resolve":
        return "default"
      case "Reject":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const columns: ColumnDef<Support>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }: { row: { original: Support } }) => (
          <div className="font-medium max-w-[200px] truncate">{row.original.title}</div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }: { row: { original: Support } }) => (
          <div className="max-w-[300px] truncate text-muted-foreground">
            {row.original.description || "-"}
          </div>
        ),
      },
      ...(isAdmin
        ? [
            {
              accessorKey: "email",
              header: "Email",
              cell: ({ row }: { row: { original: Support } }) => (
                <div className="max-w-[200px] truncate">
                  {row.original.request_id?.email || "-"}
                </div>
              ),
            },
            {
              accessorKey: "user_name",
              header: "User Name",
              cell: ({ row }: { row: { original: Support } }) => (
                <div className="max-w-[200px] truncate">
                  {row.original.request_id?.user_name || "-"}
                </div>
              ),
            },
          ]
        : []),
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }: { row: { original: Support } }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: { original: Support } }) => {
          const status = row.original.status
          return (
            <Badge variant={getStatusVariant(status) as VariantProps<typeof badgeVariants>["variant"]}>
              {status}
            </Badge>
          )
        },
      },
      ...(isAdmin
        ? [
            {
              id: "actions",
              header: "Action",
              cell: ({ row }: { row: { original: Support } }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleEdit(row.original)}
                      disabled={!isAdmin && row.original.status === "Resolve"}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(row.original)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]
        : []),
    ],
    [isAdmin, handleEdit, handleDeleteClick]
  )

  const table = useReactTable({
    data: supportData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
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
    manualSorting: false,
    manualFiltering: false,
    pageCount: supportData?.meta_data?.pages || 0,
  })

  const handleExportCSV = () => {
    const data = supportData?.data || []
    const headers = isAdmin
      ? ["Title", "Description", "Email", "User Name", "Date", "Status"]
      : ["Title", "Description", "Date", "Status"]
    const rows = data.map((support) =>
      isAdmin
        ? [
            support.title,
            support.description || "",
            support.request_id?.email || "",
            support.request_id?.user_name || "",
            formatDate(support.created_at),
            support.status,
          ]
        : [
            support.title,
            support.description || "",
            formatDate(support.created_at),
            support.status,
          ]
    )

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
      `support-${format(new Date(), "yyyy-MM-dd")}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV exported successfully")
  }

  return (
    <div className="space-y-4">
      {/* Add Button and Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        {!isAdmin && (
          <Button onClick={handleAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Request
          </Button>
        )}
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
                  No support requests found.
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
        totalPages={supportData?.meta_data?.pages || 0}
        totalItems={supportData?.meta_data?.items || 0}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Delete Dialog */}
      <SupportDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        support={selectedSupport}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* Add/Edit Dialog */}
      <SupportAddEditDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        support={selectedSupport}
        mode={dialogMode}
        onSuccess={() => {
          setAddEditDialogOpen(false)
          setSelectedSupport(null)
          refetch()
        }}
      />
    </div>
  )
}

