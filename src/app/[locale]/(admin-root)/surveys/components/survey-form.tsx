"use client"

import { useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  type Survey,
} from "@/store/api/survey/surveyApi"
import { useAppSelector } from "@/store/hooks"
import { selectMasterAdminOrganisationId } from "@/store/slices/orgContextSlice"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

function getSurveyFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(2, {
      message: t("form.validation.nameMin"),
    }),
    description: z.string().optional(),
    status: z.enum(["Draft", "Published"]),
    expirationDate: z
      .date()
      .optional()
      .refine(
        (date) => {
          if (!date) return true
          const now = new Date()
          return date > now
        },
        {
          message: t("form.validation.expirationFuture"),
        }
      ),
  })
}

type SurveyFormValues = z.infer<ReturnType<typeof getSurveyFormSchema>>

interface SurveyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  survey?: Survey | null
}

export function SurveyForm({ open, onOpenChange, survey }: SurveyFormProps) {
  const t = useTranslations("surveys")
  const surveyFormSchema = useMemo(() => getSurveyFormSchema(t), [t])
  const [createSurvey, { isLoading: isCreating }] = useCreateSurveyMutation()
  const [updateSurvey, { isLoading: isUpdating }] = useUpdateSurveyMutation()
  const authUser = useAppSelector((state) => state.auth.user)
  const masterAdminOrgId = useAppSelector(selectMasterAdminOrganisationId)

  // Organisation for payload: MasterAdmin uses org context when set, else first assigned org; Org Admin uses first assigned org
  const organisationId =
    masterAdminOrgId ??
    (authUser?.assignedOrganisationIds?.length
      ? authUser.assignedOrganisationIds[0]
      : undefined)

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "Draft",
      expirationDate: undefined,
    },
  })

  useEffect(() => {
    if (survey) {
      form.reset({
        name: survey.name,
        description: survey.description || "",
        status: survey.status === "Archived" ? "Draft" : survey.status,
        expirationDate: survey.expirationDate
          ? new Date(survey.expirationDate)
          : undefined,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        status: "Draft",
        expirationDate: undefined,
      })
    }
  }, [survey, form])

  async function onSubmit(data: SurveyFormValues) {
    try {
      // Convert expiration date to UTC midnight format if provided
      const expirationDateUTC = data.expirationDate
        ? new Date(
            Date.UTC(
              data.expirationDate.getFullYear(),
              data.expirationDate.getMonth(),
              data.expirationDate.getDate()
            )
          ).toISOString()
        : undefined

      if (survey) {
        await updateSurvey({
          surveyId: survey.id,
          updates: {
            name: data.name,
            description: data.description,
            status: data.status,
            ...(expirationDateUTC !== undefined && {
              expirationDate: expirationDateUTC,
            }),
            ...(organisationId !== undefined && { organizationId: organisationId }),
          },
        }).unwrap()
        toast.success(t("form.toastUpdateSuccess"))
      } else {
        await createSurvey({
          name: data.name,
          description: data.description,
          status: data.status,
          ...(expirationDateUTC !== undefined && {
            expirationDate: expirationDateUTC,
          }),
          ...(organisationId !== undefined && { organizationId: organisationId }),
        }).unwrap()
        toast.success(t("form.toastCreateSuccess"))
      }
      form.reset()
      onOpenChange(false)
    } catch (error: unknown) {
      let errorMessage = survey ? t("form.toastUpdateFailed") : t("form.toastCreateFailed")
      
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data
        if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = String(errorData.message)
        }
      }
      
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{survey ? t("form.titleEdit") : t("form.titleCreate")}</DialogTitle>
          <DialogDescription>
            {survey ? t("form.descriptionEdit") : t("form.descriptionCreate")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.nameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.descriptionPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.expirationLabel")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>{t("form.pickDate")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={(date) => field.onChange(date || null)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.statusLabel")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder={t("form.statusPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Draft">{t("form.statusDraft")}</SelectItem>
                      <SelectItem value="Published">{t("form.statusPublished")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("form.cancel")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={!form.formState.isValid || isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? (survey ? t("form.updating") : t("form.creating"))
                  : (survey ? t("form.update") : t("form.create"))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

