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
import { useTranslations } from "next-intl"

const raiseSchemaBase = {
  title: z.string(),
  description: z.string(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  centre_id: z.number().nullable().optional(),
}

type RaiseFormValues = {
  title: string
  description: string
  priority?: "Low" | "Medium" | "High" | "Urgent"
  centre_id?: number | null
  attachment?: FileList
}

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

  const t = useTranslations("tickets.raise")

  const raiseSchema = z.object({
    title: z.string().min(1, t("validation.titleRequired")),
    description: z.string().min(1, t("validation.descriptionRequired")),
    priority: raiseSchemaBase.priority,
    centre_id: raiseSchemaBase.centre_id,
    attachment: z.any().optional(),
  })

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
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("description", data.description)
      formData.append("priority", (data.priority as TicketPriority) ?? "Medium")
      if (typeof data.centre_id === "number" && !Number.isNaN(data.centre_id)) {
        formData.append("centre_id", String(data.centre_id))
      }
      const file = data.attachment?.item(0) ?? undefined
      if (file) {
        formData.append("file", file)
      }

      await createTicket(formData).unwrap()
      toast.success(t("toast.createSuccess"))
      reset()
      onSuccess()
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "data" in err &&
        typeof (err as { data?: { message?: string } }).data?.message === "string"
          ? (err as { data: { message: string } }).data.message
          : t("toast.createFailed")
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              {t("fields.titleLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder={t("fields.titlePlaceholder")}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("fields.descriptionLabel")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={t("fields.descriptionPlaceholder")}
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("fields.priorityLabel")}</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("fields.priorityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">{t("fields.priority.low")}</SelectItem>
                    <SelectItem value="Medium">{t("fields.priority.medium")}</SelectItem>
                    <SelectItem value="High">{t("fields.priority.high")}</SelectItem>
                    <SelectItem value="Urgent">{t("fields.priority.urgent")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {isCentreAdmin && (
            <div className="space-y-2">
              <Label htmlFor="centre_id">{t("fields.centreLabel")}</Label>
              <Input
                id="centre_id"
                type="number"
                placeholder={t("fields.centrePlaceholder")}
                {...register("centre_id", { valueAsNumber: true })}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="attachment">{t("fields.attachmentLabel")}</Label>
            <Input
              id="attachment"
              type="file"
              {...register("attachment")}
            />
            <p className="text-sm text-muted-foreground">
              {t("fields.attachmentHint")}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("buttons.creating") : t("buttons.raise")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
