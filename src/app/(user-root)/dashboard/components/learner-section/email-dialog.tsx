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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"
import { toast } from "sonner"

interface EmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  learnerEmail?: string
  learnerName?: string
}

export function EmailDialog({
  open,
  onOpenChange,
  learnerEmail,
  learnerName,
}: EmailDialogProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setSubject("")
      setMessage("")
    }
  }, [open])

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message")
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement actual email sending API call
      // await dispatch(sendMail({ email: learnerEmail, subject, message }))
      
      toast.success("Email sent successfully")
      onOpenChange(false)
      setSubject("")
      setMessage("")
    } catch (error) {
      toast.error("Failed to send email")
      console.error("Failed to send email:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <DialogTitle>Email {learnerName || "Learner"}</DialogTitle>
          </div>
          <DialogDescription>
            Send an email to {learnerEmail || "the learner"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !subject.trim() || !message.trim()}>
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

