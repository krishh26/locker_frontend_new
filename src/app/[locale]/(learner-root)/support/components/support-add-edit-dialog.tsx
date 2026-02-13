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
  useCreateSupportMutation,
  useUpdateSupportMutation,
} from "@/store/api/support/supportApi"
import { toast } from "sonner"
import { useAppSelector } from "@/store/hooks"
import type { Support } from "@/store/api/support/types"
import { Controller } from "react-hook-form"

const supportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Pending", "InProgress", "Reject", "Resolve"]).optional(),
})

type SupportFormValues = z.infer<typeof supportSchema>

interface SupportAddEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  support: Support | null
  mode: "add" | "edit"
  onSuccess: () => void
}

export function SupportAddEditDialog({
  open,
  onOpenChange,
  support,
  mode,
  onSuccess,
}: SupportAddEditDialogProps) {
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === "Admin"

  const [createSupport, { isLoading: isCreating }] = useCreateSupportMutation()
  const [updateSupport, { isLoading: isUpdating }] = useUpdateSupportMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "Pending",
    },
  })

  useEffect(() => {
    if (open) {
      if (mode === "edit" && support) {
        reset({
          title: support.title,
          description: support.description,
          status: support.status,
        })
      } else {
        reset({
          title: "",
          description: "",
          status: "Pending",
        })
      }
    }
  }, [open, mode, support, reset])

  const onSubmit = async (data: SupportFormValues) => {
    try {
      if (mode === "add") {
        if (!user?.user_id) {
          toast.error("User ID not found")
          return
        }
        await createSupport({
          request_id: typeof user.user_id === 'number' ? user.user_id : parseInt(String(user.user_id)),
          title: data.title,
          description: data.description,
        }).unwrap()
        toast.success("Support request created successfully!")
      } else {
        if (!support) return
        await updateSupport({
          support_id: support.support_id,
          title: data.title,
          description: data.description,
          status: isAdmin ? data.status : undefined,
        }).unwrap()
        toast.success("Support request updated successfully!")
      }
      onSuccess()
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data: { message: string } }).data.message
          : `Failed to ${mode === "add" ? "create" : "update"} support request. Please try again.`
      toast.error(errorMessage)
    }
  }

  const isLoading = isCreating || isUpdating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Request" : "Edit Support Request"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Submit a new support request."
              : "Update the support request details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="Add your title"
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
              placeholder="Add your description"
              rows={6}
              {...register("description")}
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
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="InProgress">InProgress</SelectItem>
                      <SelectItem value="Reject">Reject</SelectItem>
                      <SelectItem value="Resolve">Resolve</SelectItem>
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

