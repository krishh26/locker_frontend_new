"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAddCommentMutation } from "@/store/api/ticket/ticketApi"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import type { TicketComment as TicketCommentType, Ticket } from "@/store/api/ticket/types"

interface TicketCommentSectionProps {
  ticket: Ticket | null
  onCommentAdded?: () => void
}

function displayUser(
  u: TicketCommentType["user"] | null,
  unknownLabel: string
) {
  if (!u) return unknownLabel
  return u.user_name ?? [u.first_name, u.last_name].filter(Boolean).join(" ") ?? u.email ?? unknownLabel
}

export function TicketCommentSection({ ticket, onCommentAdded }: TicketCommentSectionProps) {
  const t = useTranslations("tickets.comments")
  const [message, setMessage] = useState("")
  const [addComment, { isLoading }] = useAddCommentMutation()

  const comments = ticket?.comments ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket || !message.trim()) return
    try {
      await addComment({ ticket_id: ticket.ticket_id, message: message.trim() }).unwrap()
      setMessage("")
      toast.success(t("toast.addSuccess"))
      onCommentAdded?.()
    } catch {
      toast.error(t("toast.addFailed"))
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">{t("title")}</h4>
      <ul className="space-y-3 max-h-[280px] overflow-y-auto">
        {comments.length === 0 ? (
          <li className="text-sm text-muted-foreground">{t("noComments")}</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="rounded-lg border p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{displayUser(c.user, t("unknownUser"))}</span>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(c.created_at), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{c.message}</p>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder={t("placeholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="resize-none"
          disabled={isLoading}
        />
        <Button type="submit" disabled={!message.trim() || isLoading}>
          {isLoading ? t("sending") : t("send")}
        </Button>
      </form>
    </div>
  )
}
