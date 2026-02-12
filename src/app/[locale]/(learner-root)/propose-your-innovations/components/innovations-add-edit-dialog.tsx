"use client"

import { useState, useEffect } from "react"
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
import {
  useCreateInnovationMutation,
  useUpdateInnovationMutation,
} from "@/store/api/innovations/innovationsApi"
import { toast } from "sonner"
import { useAppSelector } from "@/store/hooks"
import type { Innovation } from "@/store/api/innovations/types"
import { Controller } from "react-hook-form"

const innovationSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Open", "Closed"]).optional(),
})

type InnovationFormValues = z.infer<typeof innovationSchema>

interface InnovationsAddEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  innovation: Innovation | null
  mode: "add" | "edit"
  onSuccess: () => void
}

export function InnovationsAddEditDialog({
  open,
  onOpenChange,
  innovation,
  mode,
  onSuccess,
}: InnovationsAddEditDialogProps) {
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === "Admin"

  const [createInnovation, { isLoading: isCreating }] = useCreateInnovationMutation()
  const [updateInnovation, { isLoading: isUpdating }] = useUpdateInnovationMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<InnovationFormValues>({
    resolver: zodResolver(innovationSchema),
    defaultValues: {
      topic: "",
      description: "",
      status: "Open",
    },
  })

  useEffect(() => {
    if (open) {
      if (mode === "edit" && innovation) {
        reset({
          topic: innovation.topic,
          description: innovation.description,
          status: innovation.status,
        })
      } else {
        reset({
          topic: "",
          description: "",
          status: "Open",
        })
      }
    }
  }, [open, mode, innovation, reset])

  const onSubmit = async (data: InnovationFormValues) => {
    try {
      if (mode === "add") {
        if (!user?.user_id) {
          toast.error("User ID not found")
          return
        }
        await createInnovation({
          innovation_propose_by_id: typeof user.user_id === 'number' ? user.user_id : parseInt(String(user.user_id)),
          topic: data.topic,
          description: data.description,
        }).unwrap()
        toast.success("Innovation created successfully!")
      } else {
        if (!innovation) return
        await updateInnovation({
          id: innovation.id,
          topic: data.topic,
          description: data.description,
          status: isAdmin ? data.status : undefined,
        }).unwrap()
        toast.success("Innovation updated successfully!")
      }
      onSuccess()
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data: { message: string } }).data.message
          : `Failed to ${mode === "add" ? "create" : "update"} innovation. Please try again.`
      toast.error(errorMessage)
    }
  }

  const isLoading = isCreating || isUpdating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Submit An Idea" : "Edit Innovation"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Share your innovative ideas with the team."
              : "Update the innovation details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic <span className="text-destructive">*</span></Label>
            <Input
              id="topic"
              placeholder="Add your topic"
              {...register("topic")}
              disabled={isAdmin && mode === "edit"}
            />
            {errors.topic && (
              <p className="text-sm text-destructive">{errors.topic.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="description"
              placeholder="Add your description"
              rows={6}
              {...register("description")}
              disabled={isAdmin && mode === "edit"}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {isAdmin && mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="status">Select Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-destructive">
                  {errors.status.message}
                </p>
              )}
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
              {isLoading
                ? mode === "add"
                  ? "Creating..."
                  : "Updating..."
                : mode === "add"
                  ? "Save"
                  : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

