"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetTicketByIdQuery, useUpdateTicketMutation } from "@/store/api/ticket/ticketApi"
import { toast } from "sonner"
import { useAppSelector } from "@/store/hooks"
import type { Ticket, TicketStatus, TicketPriority } from "@/store/api/ticket/types"
import { TicketCommentSection } from "./ticket-comment-section"
import { TicketAssignDialog } from "./ticket-assign-dialog"

const PRIORITY_OPTIONS: TicketPriority[] = ["Low", "Medium", "High", "Urgent"]

const ALLOWED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  Open: ["InProgress"],
  InProgress: ["Resolved"],
  Resolved: ["Closed"],
  Closed: ["Open"],
}

function getAllowedNextStatuses(currentStatus: TicketStatus, isAdmin: boolean): TicketStatus[] {
  const next = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? []
  if (currentStatus === "Closed" && !isAdmin) return []
  return next
}

function displayUser(u: Ticket["raised_by"] | null) {
  if (!u) return "-"
  return u.user_name ?? [u.first_name, u.last_name].filter(Boolean).join(" ") ?? u.email ?? "-"
}

interface TicketDetailSheetProps {
  ticketId: number | null
  onClose: () => void
  onUpdated: () => void
}

export function TicketDetailSheet({
  ticketId,
  onClose,
  onUpdated,
}: TicketDetailSheetProps) {
  const user = useAppSelector((state) => state.auth.user)
  const isLearner = user?.role === "Learner"
  const isAdmin = !isLearner && ["Admin", "MasterAdmin", "OrganisationAdmin", "CentreAdmin", "Trainer", "IQA", "Employer", "EQA"].includes(user?.role ?? "")

  const { data, isLoading, refetch } = useGetTicketByIdQuery(ticketId!, {
    skip: ticketId == null,
  })
  const ticket = data?.data

  const isOrgAdminOrCentreAdmin = user?.role === "OrganisationAdmin" || user?.role === "CentreAdmin"
  const isRaisedByMe = ticket != null && (ticket.raised_by as { user_id?: number })?.user_id === user?.user_id
  const canAssign = isAdmin && (!isOrgAdminOrCentreAdmin || !isRaisedByMe)

  const [updateTicket, { isLoading: isUpdating }] = useUpdateTicketMutation()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [localStatus, setLocalStatus] = useState<TicketStatus | null>(null)
  const [localPriority, setLocalPriority] = useState<TicketPriority | null>(null)

  const currentStatus = localStatus ?? ticket?.status ?? "Open"
  const currentPriority = localPriority ?? ticket?.priority ?? "Medium"
  const allowedNextStatuses = getAllowedNextStatuses(currentStatus, !!isAdmin)

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return
    setLocalStatus(newStatus)
    try {
      await updateTicket({ ticket_id: ticket.ticket_id, status: newStatus }).unwrap()
      toast.success("Status updated.")
      refetch()
      onUpdated()
    } catch {
      setLocalStatus(null)
      toast.error("Failed to update status.")
    }
  }

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) return
    setLocalPriority(newPriority)
    try {
      await updateTicket({ ticket_id: ticket.ticket_id, priority: newPriority }).unwrap()
      toast.success("Priority updated.")
      refetch()
      onUpdated()
    } catch {
      setLocalPriority(null)
      toast.error("Failed to update priority.")
    }
  }

  const learnerCanClose = isLearner && ticket?.status === "Resolved"
  const adminCanReopen = isAdmin && ticket?.status === "Closed"

  return (
    <>
      <Sheet open={ticketId != null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="pr-8">
              {ticket?.ticket_number ?? "Ticket"}
            </SheetTitle>
          </SheetHeader>
          {isLoading || !ticket ? (
            <div className="p-4 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-6 p-4 pt-0">
              <div>
                <h3 className="font-medium">{ticket.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {isAdmin ? (
                    <Select
                      value={currentStatus}
                      onValueChange={(v) => handleStatusChange(v as TicketStatus)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key={currentStatus} value={currentStatus}>
                          {currentStatus}
                        </SelectItem>
                        {allowedNextStatuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : learnerCanClose ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusChange("Closed")}
                      disabled={isUpdating}
                    >
                      Mark closed
                    </Button>
                  ) : adminCanReopen ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange("Open")}
                      disabled={isUpdating}
                    >
                      Reopen
                    </Button>
                  ) : (
                    <Badge variant="secondary">{currentStatus}</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Priority</span>
                  {isAdmin ? (
                    <Select
                      value={currentPriority}
                      onValueChange={(v) => handlePriorityChange(v as TicketPriority)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{currentPriority}</Badge>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Raised by</span>
                  <span>{displayUser(ticket.raised_by)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Assigned to</span>
                  {canAssign ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssignDialogOpen(true)}
                    >
                      {ticket.assigned_to ? displayUser(ticket.assigned_to) : "Unassigned"}
                    </Button>
                  ) : (
                    <span>{ticket.assigned_to ? displayUser(ticket.assigned_to) : "-"}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(ticket.created_at), "dd MMM yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last activity</span>
                  <span>{format(new Date(ticket.last_activity_at), "dd MMM yyyy")}</span>
                </div>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Attachments</Label>
                  <ul className="space-y-1">
                    {ticket.attachments.map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {a.file_url.split("/").pop() ?? "Attachment"}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <TicketCommentSection
                ticket={ticket}
                onCommentAdded={() => {
                  refetch()
                  onUpdated()
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <TicketAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        ticket={ticket ?? null}
        onSuccess={() => {
          setAssignDialogOpen(false)
          refetch()
          onUpdated()
        }}
      />
    </>
  )
}
