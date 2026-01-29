"use client"

import { useState, useMemo, useCallback } from "react"
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, Plus, Edit, MoreVertical, CheckCircle, XCircle } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  useGetPlansQuery,
  useActivatePlanMutation,
  useDeactivatePlanMutation,
} from "@/store/api/subscriptions/subscriptionApi"
import type { Plan } from "@/store/api/subscriptions/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { CreatePlanForm } from "./create-plan-form"
import { EditPlanForm } from "./edit-plan-form"

export function PlansDataTable() {
  const { data: plansData, isLoading: plansLoading, refetch } = useGetPlansQuery()
  const [activatePlanMutation, { isLoading: isActivating }] = useActivatePlanMutation()
  const [deactivatePlanMutation, { isLoading: isDeactivating }] = useDeactivatePlanMutation()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  const plans = useMemo(() => plansData?.data ?? [], [plansData])

  const handleCreateSuccess = useCallback(() => {
    setIsCreateOpen(false)
    refetch()
  }, [refetch])

  const handleEditSuccess = useCallback(() => {
    setIsEditOpen(false)
    setSelectedPlan(null)
    refetch()
  }, [refetch])

  const handleActivate = useCallback(
    async (plan: Plan) => {
      try {
        await activatePlanMutation(plan.id).unwrap()
        toast.success("Plan activated")
        refetch()
      } catch (error: unknown) {
        const msg =
          error && typeof error === "object" && "data" in error
            ? (error as { data?: { message?: string } }).data?.message
            : error instanceof Error
              ? error.message
              : "Failed to activate plan"
        toast.error(msg)
      }
    },
    [activatePlanMutation, refetch]
  )

  const handleDeactivate = useCallback(
    async (plan: Plan) => {
      try {
        await deactivatePlanMutation(plan.id).unwrap()
        toast.success("Plan deactivated")
        refetch()
      } catch (error: unknown) {
        const msg =
          error && typeof error === "object" && "data" in error
            ? (error as { data?: { message?: string } }).data?.message
            : error instanceof Error
              ? error.message
              : "Failed to deactivate plan"
        toast.error(msg)
      }
    },
    [deactivatePlanMutation, refetch]
  )

  const columns: ColumnDef<Plan>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.code}</span>,
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
          const p = row.original
          return `${p.currency} ${p.price} / ${p.billingCycle}`
        },
      },
      {
        accessorKey: "userLimit",
        header: "User limit",
        cell: ({ row }) => row.original.userLimit ?? "—",
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const plan = row.original
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedPlan(plan); setIsEditOpen(true) }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isActivating || isDeactivating}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {plan.isActive ? (
                    <DropdownMenuItem onClick={() => handleDeactivate(plan)} disabled={isDeactivating}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Deactivate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleActivate(plan)} disabled={isActivating}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [handleActivate, handleDeactivate, isActivating, isDeactivating]
  )

  const table = useReactTable({
    data: plans,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
  })

  if (plansLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="space-y-2 w-full">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plans..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
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
            {table.getRowModel().rows?.length ? (
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
                  No plans found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Plan</DialogTitle>
            <DialogDescription>Define a new subscription plan.</DialogDescription>
          </DialogHeader>
          <CreatePlanForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {selectedPlan && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>Update plan configuration.</DialogDescription>
            </DialogHeader>
            <EditPlanForm
              plan={selectedPlan}
              onSuccess={handleEditSuccess}
              onCancel={() => { setIsEditOpen(false); setSelectedPlan(null) }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
