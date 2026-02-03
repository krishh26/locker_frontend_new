"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateOrganisationMutation } from "@/store/api/organisations/organisationApi"
import type { CreateOrganisationRequest } from "@/store/api/organisations/types"
import { toast } from "sonner"

// Schema creation function that accepts translation function
const createOrganisationSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("validation.nameRequired")),
  email: z.email(t("validation.emailInvalid")).optional().or(z.literal("")),
  status: z.enum(["active", "suspended"]),
})

type CreateOrganisationFormValues = z.infer<ReturnType<typeof createOrganisationSchema>>

interface CreateOrganisationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateOrganisationForm({
  onSuccess,
  onCancel,
}: CreateOrganisationFormProps) {
  const t = useTranslations("organisations")
  const common = useTranslations("common")
  const [createOrganisation, { isLoading: isCreating }] = useCreateOrganisationMutation()

  const form = useForm<CreateOrganisationFormValues>({
    resolver: zodResolver(createOrganisationSchema(t)),
    defaultValues: {
      name: "",
      email: "",
      status: "active",
    },
  })

  const onSubmit = async (values: CreateOrganisationFormValues) => {
    try {
      const createData: CreateOrganisationRequest = {
        name: values.name,
        email: values.email || undefined,
        status: values.status,
      }

      await createOrganisation(createData).unwrap()
      toast.success(t("toast.createSuccess"))
      form.reset()
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : undefined
      toast.error(errorMessage || t("toast.createFailed"))
    }
  }

  const isLoading = isCreating
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t("form.name")}
          <span className="text-destructive">{t("form.required")}</span>
        </Label>
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <>
              <Input
                id="name"
                placeholder={t("form.namePlaceholder")}
                {...field}
                className={form.formState.errors.name ? "border-destructive" : ""}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t("form.email")}</Label>
        <Controller
          name="email"
          control={form.control}
          render={({ field }) => (
            <>
              <Input
                id="email"
                type="email"
                placeholder={t("form.emailPlaceholder")}
                {...field}
                className={form.formState.errors.email ? "border-destructive" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">
          {t("form.status")}
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="status"
                  className={form.formState.errors.status ? "w-full border-destructive" : "w-full"}
                >
                  <SelectValue placeholder={t("form.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("form.statusActive")}</SelectItem>
                  <SelectItem value="suspended">{t("form.statusSuspended")}</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.status.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {common("cancel")}
        </Button>
        <Button type="submit" disabled={isLoading || hasErrors} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("form.createOrganisation")}
        </Button>
      </div>
    </form>
  )
}
