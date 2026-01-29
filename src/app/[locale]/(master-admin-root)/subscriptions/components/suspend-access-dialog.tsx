"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useSuspendOrganisationAccessMutation } from "@/store/api/subscriptions/subscriptionApi"
import { toast } from "sonner"

interface SuspendAccessDialogProps {
  organisationId: number
  organisationName?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function SuspendAccessDialog({
  organisationId,
  organisationName,
  onSuccess,
  onCancel,
}: SuspendAccessDialogProps) {
  const [suspendAccessMutation, { isLoading: isSuspending }] = useSuspendOrganisationAccessMutation()
  const [reason, setReason] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await suspendAccessMutation({ organisationId, reason: reason || undefined }).unwrap()
      toast.success("Organisation access suspended")
      setReason("")
      onSuccess?.()
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : "Failed to suspend access"
      toast.error(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {organisationName && (
        <div className="space-y-2">
          <Label>Organisation</Label>
          <p className="text-sm font-medium">{organisationName}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Input
          id="reason"
          placeholder="e.g. Payment overdue"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isSuspending}
        />
      </div>
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSuspending}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isSuspending}>
          {isSuspending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Suspend Access
        </Button>
      </div>
    </form>
  )
}
