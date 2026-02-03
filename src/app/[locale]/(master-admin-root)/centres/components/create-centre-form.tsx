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
import { useCreateCentreMutation } from "@/store/api/centres/centreApi"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import type { CreateCentreRequest } from "@/store/api/centres/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

// Schema creation function that accepts translation function
const createCentreSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("validation.nameRequired")),
  organisationId: z
    .union([z.number().min(1, t("validation.organisationRequired")), z.undefined()])
    .refine((v) => v !== undefined && v >= 1, { message: t("validation.organisationRequired") }),
  status: z.enum(["active", "suspended"]),
})

type CreateCentreFormValues = z.infer<ReturnType<typeof createCentreSchema>>

interface CreateCentreFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  defaultOrganisationId?: number
}

export function CreateCentreForm({
  onSuccess,
  onCancel,
  defaultOrganisationId,
}: CreateCentreFormProps) {
  const t = useTranslations("centres")
  const common = useTranslations("common")
  const [createCentre, { isLoading: isCreating }] = useCreateCentreMutation()
  const { data: organisationsData, isLoading: isLoadingOrgs } = useGetOrganisationsQuery({
    status: "active",
    page: 1,
    limit: 500,
    meta: "true",
  })

  const organisations = organisationsData?.data || []

  const form = useForm<CreateCentreFormValues>({
    resolver: zodResolver(createCentreSchema(t)),
    defaultValues: {
      name: "",
      organisationId: defaultOrganisationId || undefined,
      status: "active",
    },
  })

  const onSubmit = async (values: CreateCentreFormValues) => {
    if (values.organisationId == null) return
    try {
      const createData: CreateCentreRequest = {
        name: values.name,
        organisationId: values.organisationId,
        status: values.status,
      }

      await createCentre(createData).unwrap()
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
      toast.error(errorMessage ?? t("toast.createFailed"))
    }
  }

  const isLoading = isCreating || isLoadingOrgs
  const hasErrors = Object.keys(form.formState.errors).length > 0

  if (isLoadingOrgs) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Organisation */}
      <div className="space-y-2">
        <Label htmlFor="organisationId">
          {t("form.organisation")}
          <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="organisationId"
          control={form.control}
          render={({ field }) => (
            <>
              <Select
                value={field.value != null ? field.value.toString() : ""}
                onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="organisationId"
                  className={form.formState.errors.organisationId ? "w-full border-destructive" : "w-full"}
                >
                  <SelectValue placeholder={t("form.organisationPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {organisations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.organisationId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.organisationId.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t("form.name")}
          <span className="text-destructive">*</span>
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
                disabled={isLoading}
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
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
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
          {t("form.createCentre")}
        </Button>
      </div>
    </form>
  )
}
