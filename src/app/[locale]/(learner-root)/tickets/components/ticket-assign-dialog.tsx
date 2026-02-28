"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateTicketMutation, useGetAssignableUsersQuery } from "@/store/api/ticket/ticketApi"
import { toast } from "sonner"
import type { Ticket, TicketUser } from "@/store/api/ticket/types"

interface TicketAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket | null
  onSuccess: () => void
}

function displayUser(u: TicketUser | null) {
  if (!u) return ""
  return u.user_name ?? [u.first_name, u.last_name].filter(Boolean).join(" ") ?? u.email ?? ""
}

export function TicketAssignDialog({
  open,
  onOpenChange,
  ticket,
  onSuccess,
}: TicketAssignDialogProps) {
  const [assigneeId, setAssigneeId] = useState<string>("")

  const [updateTicket, { isLoading }] = useUpdateTicketMutation()
  const { data: assignableData } = useGetAssignableUsersQuery(
    { ticket_id: ticket?.ticket_id },
    { skip: !open || !ticket?.ticket_id }
  )
  const users = assignableData?.data ?? []

  useEffect(() => {
    if (open && ticket) {
      setAssigneeId(ticket.assigned_to?.user_id != null ? String(ticket.assigned_to.user_id) : "unassigned")
    }
  }, [open, ticket])

  const handleAssign = async () => {
    if (!ticket) return
    const value = assigneeId === "unassigned" ? null : parseInt(assigneeId, 10)
    if (value !== null && isNaN(value)) return
    try {
      await updateTicket({
        ticket_id: ticket.ticket_id,
        assigned_to: value as number | null,
      }).unwrap()
      toast.success("Ticket assignment updated.")
      onSuccess()
    } catch {
      toast.error("Failed to update assignment.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign ticket</DialogTitle>
          <DialogDescription>
            Assign this ticket to a user. Only users in the same org/centre can be selected.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Assigned to</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.user_id} value={String(u.user_id)}>
                    {displayUser(u) || `User ${u.user_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
