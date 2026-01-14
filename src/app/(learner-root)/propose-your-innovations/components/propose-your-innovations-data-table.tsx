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
  Eye,
  Pencil,
  Trash2,
  Download,
  MoreHorizontal,
  Plus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useGetInnovationsQuery,
  useDeleteInnovationMutation,
} from "@/store/api/innovations/innovationsApi"
import { toast } from "sonner"
import { DataTablePagination } from "@/components/data-table-pagination"
import { useAppSelector } from "@/store/hooks"
import type { Innovation } from "@/store/api/innovations/types"
import { InnovationsDeleteDialog } from "./innovations-delete-dialog"
import { InnovationsAddEditDialog } from "./innovations-add-edit-dialog"
import { InnovationsViewChatDrawer } from "./innovations-view-chat-drawer"

export function ProposeYourInnovationsDataTable() {
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === "Admin"

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false)
  const [viewChatDrawerOpen, setViewChatDrawerOpen] = useState(false)
  const [selectedInnovation, setSelectedInnovation] = useState<Innovation | null>(null)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")

  // For non-admin users, filter by their user_id
  const userId: number | undefined = !isAdmin && user?.user_id
    ? (typeof user.user_id === 'number' ? user.user_id : parseInt(String(user.user_id)))
    : undefined

  const {
    data: innovationsData,
    isLoading,
    refetch,
  } = useGetInnovationsQuery({
    page,
    page_size: pageSize,
    userId,
  }, {
    refetchOnMountOrArgChange: true,
  })

  const [deleteInnovation, { isLoading: isDeleting }] = useDeleteInnovationMutation()

  const handleView = useCallback((row: Innovation) => {
    setSelectedInnovation(row)
    setViewChatDrawerOpen(true)
  }, [])

  const handleEdit = useCallback((row: Innovation) => {
    setSelectedInnovation(row)
    setDialogMode("edit")
    setAddEditDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((row: Innovation) => {
    setSelectedInnovation(row)
    setDeleteDialogOpen(true)
  }, [])

  const handleAddClick = useCallback(() => {
    setSelectedInnovation(null)
    setDialogMode("add")
    setAddEditDialogOpen(true)
  }, [])

  const handleDeleteConfirm = async () => {
    if (!selectedInnovation) return

    try {
      await deleteInnovation({ id: selectedInnovation.id }).unwrap()
      toast.success("Innovation deleted successfully!")
      setDeleteDialogOpen(false)
      setSelectedInnovation(null)
      refetch()
    } catch {
      toast.error("Failed to delete innovation. Please try again.")
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

  const columns: ColumnDef<Innovation>[] = useMemo(
    () => [
      {
        accessorKey: "topic",
        header: "Topic",
        cell: ({ row }) => (
          <div className="font-medium max-w-[200px] truncate">{row.original.topic}</div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
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
              cell: ({ row }: { row: { original: Innovation } }) => (
                <div className="max-w-[200px] truncate">
                  {row.original.innovation_propose_by_id?.email || "-"}
                </div>
              ),
            },
            {
              accessorKey: "user_name",
              header: "User Name",
              cell: ({ row }: { row: { original: Innovation } }) => (
                <div className="max-w-[200px] truncate">
                  {row.original.innovation_propose_by_id?.user_name || "-"}
                </div>
              ),
            },
          ]
        : []),
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge
              variant={status === "Open" ? "default" : "secondary"}
            >
              {status}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                View & Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEdit(row.original)}
                disabled={!isAdmin && row.original.status === "Closed"}
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
    ],
    [isAdmin, handleView, handleEdit, handleDeleteClick]
  )

  const table = useReactTable({
    data: innovationsData?.data || [],
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
    pageCount: innovationsData?.meta_data?.pages || 0,
  })

  const handleExportCSV = () => {
    const data = innovationsData?.data || []
    const headers = isAdmin
      ? ["Topic", "Description", "Email", "User Name", "Date", "Status"]
      : ["Topic", "Description", "Date", "Status"]
    const rows = data.map((innovation) =>
      isAdmin
        ? [
            innovation.topic,
            innovation.description || "",
            innovation.innovation_propose_by_id?.email || "",
            innovation.innovation_propose_by_id?.user_name || "",
            formatDate(innovation.created_at),
            innovation.status,
          ]
        : [
            innovation.topic,
            innovation.description || "",
            formatDate(innovation.created_at),
            innovation.status,
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
      `innovations-${format(new Date(), "yyyy-MM-dd")}.csv`
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!isAdmin && (
          <Button onClick={handleAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Submit An Idea
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
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
                  No innovations found.
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
        totalPages={innovationsData?.meta_data?.pages || 0}
        totalItems={innovationsData?.meta_data?.items || 0}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Delete Dialog */}
      <InnovationsDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        innovation={selectedInnovation}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* Add/Edit Dialog */}
      <InnovationsAddEditDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        innovation={selectedInnovation}
        mode={dialogMode}
        onSuccess={() => {
          setAddEditDialogOpen(false)
          setSelectedInnovation(null)
          refetch()
        }}
      />

      {/* View & Chat Drawer */}
      <InnovationsViewChatDrawer
        open={viewChatDrawerOpen}
        onOpenChange={setViewChatDrawerOpen}
        innovation={selectedInnovation}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}

