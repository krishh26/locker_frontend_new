"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateTicketMutation } from "@/store/api/ticket/ticketApi"
import { toast } from "sonner"
import { useAppSelector } from "@/store/hooks"
import type { TicketPriority } from "@/store/api/ticket/types"
import { Controller } from "react-hook-form"

const raiseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  centre_id: z.number().nullable().optional(),
})

type RaiseFormValues = z.infer<typeof raiseSchema>

interface TicketRaiseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TicketRaiseDialog({
  open,
  onOpenChange,
  onSuccess,
}: TicketRaiseDialogProps) {
  const user = useAppSelector((state) => state.auth.user)
  const isCentreAdmin = user?.role === "CentreAdmin"

  const [createTicket, { isLoading }] = useCreateTicketMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<RaiseFormValues>({
    resolver: zodResolver(raiseSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      centre_id: undefined,
    },
  })

  const onSubmit = async (data: RaiseFormValues) => {
    try {
      await createTicket({
        title: data.title,
        description: data.description,
        priority: (data.priority as TicketPriority) ?? "Medium",
        centre_id: data.centre_id ?? undefined,
      }).unwrap()
      toast.success("Ticket raised successfully!")
      reset()
      onSuccess()
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "data" in err &&
        typeof (err as { data?: { message?: string } }).data?.message === "string"
          ? (err as { data: { message: string } }).data.message
          : "Failed to raise ticket. Please try again."
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Raise a ticket</DialogTitle>
          <DialogDescription>
            Submit a new ticket. Provide a clear title and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="Brief title"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="description"
              placeholder="Describe the issue or request"
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {isCentreAdmin && (
            <div className="space-y-2">
              <Label htmlFor="centre_id">Centre (optional)</Label>
              <Input
                id="centre_id"
                type="number"
                placeholder="Centre ID"
                {...register("centre_id", { valueAsNumber: true })}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Raise ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
