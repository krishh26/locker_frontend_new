"use client"

import { useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { LearnerListItem } from "@/store/api/learner/types"
import type { User } from "@/store/api/user/types"

interface UserSelectionTableProps {
  data: (User | LearnerListItem)[]
  selectedIds: Set<number>
  onSelectionChange: (ids: Set<number>) => void
  isLoading?: boolean
}

export function UserSelectionTable({
  data,
  selectedIds,
  onSelectionChange,
  isLoading = false,
}: UserSelectionTableProps) {

  const getItemId = (item: User | LearnerListItem): number => {
    // Check if item has user_id (User type always has it)
    if ("user_id" in item) {
      return item.user_id as number
    }
    // For learners, check if user_id exists in the object (might not be in type definition)
    const learner = item as LearnerListItem & { user_id?: number }
    return learner.user_id || 0
  }


  const allSelected = useMemo(() => {
    if (data.length === 0) return false
    return data.every((item) => {
      const id = getItemId(item)
      return selectedIds.has(id)
    })
  }, [data, selectedIds])

  const someSelected = useMemo(() => {
    if (data.length === 0) return false
    return data.some((item) => {
      const id = getItemId(item)
      return selectedIds.has(id)
    })
  }, [data, selectedIds])

  const handleSelectAll = (checked: boolean) => {
    const newSelection = new Set(selectedIds)
    if (checked) {
      data.forEach((item) => {
        const id = getItemId(item)
        newSelection.add(id)
      })
    } else {
      data.forEach((item) => {
        const id = getItemId(item)
        newSelection.delete(id)
      })
    }
    onSelectionChange(newSelection)
  }

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelection = new Set(selectedIds)
    if (checked) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    onSelectionChange(newSelection)
  }

  const getItemName = (item: User | LearnerListItem): string => {
    return `${item.first_name} ${item.last_name}`.trim() || item.user_name
  }

  const getItemEmail = (item: User | LearnerListItem): string => {
    return item.email
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">No users found</div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const id = getItemId(item)
            const isSelected = selectedIds.has(id)
            return (
              <TableRow key={id} className={isSelected ? "bg-muted/50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectItem(id, checked === true)}
                    aria-label={`Select ${getItemName(item)}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{getItemName(item)}</TableCell>
                <TableCell>{getItemEmail(item)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

