"use client"

import { useState, useMemo, useCallback } from "react"
import {
  type ColumnDef,
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
  Eye,
  UserPlus,
} from "lucide-react"
import { format } from "date-fns"

import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useGetTicketListQuery,
  useDeleteTicketMutation,
} from "@/store/api/ticket/ticketApi"
import { toast } from "sonner"
import { DataTablePagination } from "@/components/data-table-pagination"
import { useAppSelector } from "@/store/hooks"
import type { Ticket, TicketStatus, TicketPriority } from "@/store/api/ticket/types"
import { TicketDeleteDialog } from "./ticket-delete-dialog"
import { TicketRaiseDialog } from "./ticket-raise-dialog"
import { TicketDetailSheet } from "./ticket-detail-sheet"
import { TicketAssignDialog } from "./ticket-assign-dialog"
import { VariantProps } from "class-variance-authority"

const STATUS_OPTIONS: TicketStatus[] = ["Open", "InProgress", "Resolved", "Closed"]
const PRIORITY_OPTIONS: TicketPriority[] = ["Low", "Medium", "High", "Urgent"]

function getStatusVariant(status: string): VariantProps<typeof badgeVariants>["variant"] {
  switch (status) {
    case "Open":
      return "secondary"
    case "InProgress":
      return "default"
    case "Resolved":
      return "default"
    case "Closed":
      return "outline"
    default:
      return "secondary"
  }
}

function getPriorityVariant(priority: string): VariantProps<typeof badgeVariants>["variant"] {
  switch (priority) {
    case "Urgent":
      return "destructive"
    case "High":
      return "default"
    case "Medium":
    case "Low":
    default:
      return "secondary"
  }
}

function displayUser(user: { user_name?: string; first_name?: string; last_name?: string; email?: string } | null) {
  if (!user) return "-"
  const name = (user.user_name ?? [user.first_name, user.last_name].filter(Boolean).join(" ")) || user.email
  return name || "-"
}

export function TicketsDataTable() {
  const user = useAppSelector((state) => state.auth.user)
  const isLearner = user?.role === "Learner"
  const isMasterAdmin = user?.role === "MasterAdmin"
  const isAdmin = !isLearner && ["Admin", "MasterAdmin", "OrganisationAdmin", "CentreAdmin", "Trainer", "IQA", "Employer", "EQA"].includes(user?.role ?? "")
  const canRaiseTicket = ["Learner", "CentreAdmin", "OrganisationAdmin" ,"Admin" ,"Trainer", "IQA", "Employer", "EQA"].includes(user?.role ?? "")
  const showRaisedByMeFilter = isAdmin && !isMasterAdmin
  const isOrgAdminOrCentreAdmin = showRaisedByMeFilter

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all")
  const [raisedByMeFilter, setRaisedByMeFilter] = useState<"mine" | "under">(() =>
    ["OrganisationAdmin", "CentreAdmin"].includes(user?.role ?? "") ? "mine" : "under"
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [raiseDialogOpen, setRaiseDialogOpen] = useState(false)
  const [detailTicketId, setDetailTicketId] = useState<number | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const {
    data: ticketData,
    isLoading,
    refetch,
  } = useGetTicketListQuery({
    page,
    limit: pageSize,
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    assigned_to: assignedToFilter !== "all" ? parseInt(assignedToFilter, 10) : undefined,
    keyword: keyword.trim() || undefined,
    raised_by_me: showRaisedByMeFilter && raisedByMeFilter === "mine" ? true : undefined,
    scope_only_not_mine: showRaisedByMeFilter && raisedByMeFilter === "under" ? true : undefined,
  }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })

  const [deleteTicket, { isLoading: isDeleting }] = useDeleteTicketMutation()

  const handleView = useCallback((row: Ticket) => {
    setDetailTicketId(row.ticket_id)
  }, [])

  const handleAssignClick = useCallback((row: Ticket) => {
    setSelectedTicket(row)
    setAssignDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((row: Ticket) => {
    setSelectedTicket(row)
    setDeleteDialogOpen(true)
  }, [])

  const handleRaiseClick = useCallback(() => {
    setRaiseDialogOpen(true)
  }, [])

  const handleDeleteConfirm = async () => {
    if (!selectedTicket) return
    try {
      await deleteTicket({ ticket_id: selectedTicket.ticket_id }).unwrap()
      toast.success("Ticket deleted successfully!")
      setDeleteDialogOpen(false)
      setSelectedTicket(null)
      refetch()
    } catch {
      toast.error("Failed to delete ticket. Please try again.")
    }
  }

  const handlePageChange = (newPage: number) => setPage(newPage)
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const formatDate = (date: string) => {
    if (!date) return ""
    return format(new Date(date), "dd MMM yyyy")
  }

  const columns: ColumnDef<Ticket>[] = useMemo(
    () => [
      {
        accessorKey: "ticket_number",
        header: "Ticket #",
        cell: ({ row }) => (
          <div className="font-mono font-medium">{row.original.ticket_number}</div>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="font-medium max-w-[200px] truncate">{row.original.title}</div>
        ),
      },
      ...(isAdmin
        ? [
            {
              id: "raised_by",
              header: "Raised by",
              cell: ({ row }: { row: { original: Ticket } }) => (
                <div className="max-w-[160px] truncate">
                  {displayUser(row.original.raised_by)}
                </div>
              ),
            },
          ]
        : []),
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge variant={getStatusVariant(status)}>
              {status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const priority = row.original.priority
          return (
            <Badge variant={getPriorityVariant(priority)}>
              {priority}
            </Badge>
          )
        },
      },
      ...(isAdmin
        ? [
            {
              id: "assigned_to",
              header: "Assigned to",
              cell: ({ row }: { row: { original: Ticket } }) => (
                <div className="max-w-[160px] truncate">
                  {displayUser(row.original.assigned_to ?? null)}
                </div>
              ),
            },
          ]
        : []),
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: Ticket } }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {(() => {
                const raisedByUserId = (row.original.raised_by as { user_id?: number })?.user_id
                const isRaisedByMe = raisedByUserId != null && raisedByUserId === user?.user_id
                const canAssignOrDelete = isAdmin && (!isOrgAdminOrCentreAdmin || !isRaisedByMe)
                return canAssignOrDelete ? (
                  <>
                    <DropdownMenuItem onClick={() => handleAssignClick(row.original)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(row.original)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : null
              })()}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isAdmin, isOrgAdminOrCentreAdmin, user?.user_id, handleView, handleAssignClick, handleDeleteClick]
  )

  const table = useReactTable({
    data: ticketData?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnVisibility },
    manualPagination: true,
    manualSorting: false,
    manualFiltering: false,
    pageCount: ticketData?.meta_data?.pages ?? 0,
  })

  const handleExportCSV = () => {
    const data = ticketData?.data ?? []
    const headers = isAdmin
      ? ["Ticket #", "Title", "Raised by", "Status", "Priority", "Assigned to", "Created"]
      : ["Ticket #", "Title", "Status", "Priority", "Created"]
    const rows = data.map((t) =>
      isAdmin
        ? [
            t.ticket_number,
            t.title,
            displayUser(t.raised_by),
            t.status,
            t.priority,
            displayUser(t.assigned_to ?? null),
            formatDate(t.created_at),
          ]
        : [t.ticket_number, t.title, t.status, t.priority, formatDate(t.created_at)]
    )
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.setAttribute("href", URL.createObjectURL(blob))
    link.setAttribute("download", `tickets-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV exported successfully")
  }

  return (
    <div className="space-y-4">
      {showRaisedByMeFilter && (
        <p className="text-sm text-muted-foreground">
          {raisedByMeFilter === "mine" ? "Showing: My tickets" : "Showing: Under my scope (raised by others)"}
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search tickets..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            className="max-w-[240px]"
          />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showRaisedByMeFilter && (
            <Select
              value={raisedByMeFilter}
              onValueChange={(v: "mine" | "under") => {
                setRaisedByMeFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mine">My tickets</SelectItem>
                <SelectItem value="under">Under my scope</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="icon" onClick={handleExportCSV} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        {canRaiseTicket && (
          <Button onClick={handleRaiseClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Raise ticket
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        manualPagination
        currentPage={page}
        totalPages={ticketData?.meta_data?.pages ?? 0}
        totalItems={ticketData?.meta_data?.items ?? 0}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <TicketRaiseDialog
        open={raiseDialogOpen}
        onOpenChange={setRaiseDialogOpen}
        onSuccess={() => {
          setRaiseDialogOpen(false)
          refetch()
        }}
      />

      <TicketDetailSheet
        ticketId={detailTicketId}
        onClose={() => setDetailTicketId(null)}
        onUpdated={() => refetch()}
      />

      <TicketAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        ticket={selectedTicket}
        onSuccess={() => {
          setAssignDialogOpen(false)
          setSelectedTicket(null)
          refetch()
        }}
      />

      <TicketDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        ticket={selectedTicket}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  )
}
