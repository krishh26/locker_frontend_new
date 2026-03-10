"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
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
import { useTranslations } from "next-intl"

type SupportFormValues = {
  title: string
  description: string
  status?: "Pending" | "InProgress" | "Reject" | "Resolve"
}

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

  const t = useTranslations("support")

  const supportSchema = z.object({
    title: z.string().min(1, t("form.validation.titleRequired")),
    description: z.string().min(1, t("form.validation.descriptionRequired")),
    status: z.enum(["Pending", "InProgress", "Reject", "Resolve"]).optional(),
  })

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
          toast.error(t("form.toast.userIdNotFound"))
          return
        }
        await createSupport({
          request_id:
            typeof user.user_id === "number"
              ? user.user_id
              : parseInt(String(user.user_id)),
          title: data.title,
          description: data.description,
        }).unwrap()
        toast.success(t("form.toast.createSuccess"))
      } else {
        if (!support) return
        await updateSupport({
          support_id: support.support_id,
          title: data.title,
          description: data.description,
          status: isAdmin ? data.status : undefined,
        }).unwrap()
        toast.success(t("form.toast.updateSuccess"))
      }
      onSuccess()
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data: { message: string } }).data.message
          : t(
              mode === "add"
                ? "form.toast.createFailed"
                : "form.toast.updateFailed"
            )
      toast.error(errorMessage)
    }
  }

  const isLoading = isCreating || isUpdating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? t("form.titleAdd")
              : t("form.titleEdit")}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? t("form.descriptionAdd")
              : t("form.descriptionEdit")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              {t("form.fields.titleLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder={t("form.fields.titlePlaceholder")}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("form.fields.descriptionLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={t("form.fields.descriptionPlaceholder")}
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
              <Label htmlFor="status">
                {t("form.fields.statusLabel")}
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "form.fields.statusPlaceholder"
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">
                        {t("form.fields.status.pending")}
                      </SelectItem>
                      <SelectItem value="InProgress">
                        {t("form.fields.status.inProgress")}
                      </SelectItem>
                      <SelectItem value="Reject">
                        {t("form.fields.status.reject")}
                      </SelectItem>
                      <SelectItem value="Resolve">
                        {t("form.fields.status.resolve")}
                      </SelectItem>
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
              {t("form.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? mode === "add"
                  ? t("form.buttons.creating")
                  : t("form.buttons.updating")
                : mode === "add"
                  ? t("form.buttons.save")
                  : t("form.buttons.update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

