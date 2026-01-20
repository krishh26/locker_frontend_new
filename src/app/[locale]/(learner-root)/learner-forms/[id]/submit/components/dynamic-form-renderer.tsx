"use client"

import { useState, useEffect } from "react"
import { useForm, Controller, Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "@/i18n/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
// Using Card for alerts since alert component may not exist
import { Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  useGetFormDataDetailsQuery,
  useSubmitFormMutation,
} from "@/store/api/forms/formsApi"
import { useAppSelector } from "@/store/hooks"
import type { FormField } from "@/store/api/forms/types"
import { FileUploadField } from "./file-upload-field"
import { SignatureInput } from "./signature-input"

interface DynamicFormRendererProps {
  formId: string
  formName?: string
  description?: string
  fields: FormField[]
}

const widthToClass = (width?: string) => {
  switch (width) {
    case "half":
      return "md:col-span-6"
    case "third":
      return "md:col-span-4"
    default:
      return "md:col-span-12"
  }
}

const getDynamicZodSchema = (fields: FormField[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {}

  fields.forEach((field) => {
    const { id, label, required, type } = field

    let schema: z.ZodTypeAny

    switch (type) {
      case "email":
        schema = z.string().email(`${label} must be a valid email`)
        break
      case "number":
        schema = z.coerce
          .number()
          .refine((val) => !isNaN(val), {
            message: `${label} must be a number`,
          })
        break
      case "phone":
        schema = z
          .string()
          .regex(/^\+?[0-9]*$/, `${label} must contain only numbers`)
        break
      case "checkbox":
        schema = z.array(z.string())
        break
      case "file":
        schema = z
          .instanceof(File, { message: `${label} is required` })
          .optional()
          .refine(
            (file) => {
              if (!required) return true
              return file !== undefined
            },
            { message: `${label} is required` }
          )
          .refine(
            (file) => {
              if (!file) return true
              return file.size <= 10 * 1024 * 1024 // 10MB
            },
            { message: `${label} is too large (max 10MB)` }
          )
        break
      case "signature":
        schema = z.any().optional()
        break
      case "textfield": // Handle API's "textfield" type
      case "text":
      default:
        schema = z.string()
        break
    }

    if (required && type !== "file" && type !== "signature") {
      if (z.string().safeParse("").success) {
        schema = (schema as z.ZodString).min(1, `${label} is required`)
      }
    }

    schemaObject[id] = schema
  })

  return z.object(schemaObject)
}

export function DynamicFormRenderer({
  formId,
  formName,
  description,
  fields,
}: DynamicFormRendererProps) {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)
  const learner = useAppSelector((state) => state.auth.learner)
  const isEmployer = user?.role === "Employer";
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftLoading, setIsDraftLoading] = useState(false)

  const validationSchema = getDynamicZodSchema(fields)

  const { data: formDataDetails } = useGetFormDataDetailsQuery(
    {
      formId,
      userId: (user?.user_id as string | number) || 0,
    },
    {
      skip: !user?.user_id,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
    }
  )

  const [submitForm] = useSubmitFormMutation()

  const isLocked = formDataDetails?.data?.is_locked || false

  const {
    handleSubmit,
    control,
    reset,
    formState: {},
    getValues,
  } = useForm({
    resolver: zodResolver(validationSchema),
    mode: "onSubmit",
    defaultValues: fields.reduce((acc, field) => {
      acc[field.id] = field.type === "checkbox" ? [] : ""
      return acc
    }, {} as Record<string, string | string[] | File | undefined>),
  })

  // Apply preset values and form data
  useEffect(() => {
    if (!user) return

    const presetMap: Record<string, string | number | null | undefined> = {
      learnerFullName:
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || undefined,
      LearnerEmail: typeof user.email === "string" ? user.email : undefined,
      LearnerPhoneNumber:
        typeof user.mobile === "string" ? user.mobile : undefined,
    }

    if (learner) {
      Object.keys(learner).forEach((key) => {
        const value = (learner as Record<string, unknown>)[key]
        if (typeof value === "string" || typeof value === "number") {
          presetMap[key] = value
        } else if (value === null || value === undefined) {
          presetMap[key] = value
        } else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Skip nested objects
          return
        }
      })
    }

    const defaultValues: Record<string, string | string[] | File | undefined> =
      {}

    fields.forEach((field) => {
      let defaultValue: string | string[] | File | undefined = ""

      if (user.role === "Learner" && field.presetField) {
        const presetValue = presetMap[field.presetField]
        if (presetValue !== undefined && presetValue !== null) {
          defaultValue = String(presetValue)
        } else {
          defaultValue = field.type === "checkbox" ? [] : ""
        }
      } else {
        defaultValue = field.type === "checkbox" ? [] : ""
      }

      defaultValues[field.id] = defaultValue
    })

     // Apply saved form data if available
     // API returns form_data as an object mapping field IDs to values
     if (formDataDetails?.data?.form_data && Object.keys(formDataDetails.data.form_data).length > 0) {
       Object.entries(formDataDetails.data.form_data).forEach(([key, value]) => {
         const fieldDef = fields.find((f) => f.id === key)
         if (!fieldDef) return

         if (fieldDef.type === "checkbox") {
           defaultValues[key] =
             typeof value === "string" && value
               ? value.split(",").map((v) => v.trim())
               : Array.isArray(value)
               ? value
               : []
         } else if (fieldDef.type === "signature") {
           // Try to parse signature as JSON if it's a string, otherwise use as-is
           try {
             const parsed = typeof value === "string" && value ? JSON.parse(value) : value
             if (parsed && typeof parsed === "object" && parsed.dataURL) {
               defaultValues[key] = parsed
             } else if (value) {
               defaultValues[key] = String(value)
             }
           } catch {
             // If parsing fails, treat as string
             if (value) {
               defaultValues[key] = String(value)
             }
           }
         } else if (value !== null && value !== undefined && value !== "") {
           defaultValues[key] = String(value)
         }
       })
     }

    reset(defaultValues)
  }, [fields, formDataDetails, user, learner, reset])

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!user?.user_id) return

    setIsSubmitting(true)

    try {
      // Build form_data object mapping field IDs to values
      const formDataObject: Record<string, string> = {}
      const fileFields: Record<string, File> = {}

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          // Files will be handled separately
          fileFields[key] = value
        } else if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          // Handle signature objects - stringify them
          formDataObject[key] = JSON.stringify(value)
        } else if (Array.isArray(value)) {
          // Handle checkbox arrays - join with comma
          formDataObject[key] = (value as string[]).join(",")
        } else {
          // Handle regular string/number values - include empty strings
          formDataObject[key] = String(value ?? "")
        }
      })

      console.log("🚀 ~ onSubmit ~ formDataObject:", formDataObject)

      // Always use FormData (even without files)
      const formData = new FormData()
      formData.append("form_id", String(formId))
      formData.append("user_id", String(user.user_id))
      formData.append("form_data", JSON.stringify(formDataObject))
      if (user.role === "Learner") {
        formData.append("submit", "true")
      }

      // Append files if any
      Object.entries(fileFields).forEach(([key, file]) => {
        formData.append(key, file, file.name)
      })

      await submitForm({
        formId: String(formId),
        userId: String(user.user_id),
        formData,
        submit: user.role === "Learner",
      }).unwrap()

      toast.success("Form submitted successfully!")

      if (user.role === "Learner") {
        setTimeout(() => {
          router.push("/learner-forms")
        }, 2000)
      }
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message ===
          "string"
          ? (error as { data: { message: string } }).data.message
          : "Failed to submit form. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSaveAsDraft = async () => {
    if (!user?.user_id) return

    setIsDraftLoading(true)

    try {
      const data = getValues()

      // Build form_data object mapping field IDs to values
      const formDataObject: Record<string, string> = {}
      const fileFields: Record<string, File> = {}

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          fileFields[key] = value
        } else if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          formDataObject[key] = JSON.stringify(value)
        } else if (Array.isArray(value)) {
          formDataObject[key] = (value as string[]).join(",")
        } else {
          formDataObject[key] = String(value || "")
        }
      })

      // Always use FormData (even without files)
      const formData = new FormData()
      formData.append("form_id", String(formId))
      formData.append("user_id", String(user.user_id))
      formData.append("form_data", JSON.stringify(formDataObject))
      formData.append("submit", "false")

      // Append files if any
      Object.entries(fileFields).forEach(([key, file]) => {
        formData.append(key, file, file.name)
      })

      await submitForm({
        formId: String(formId),
        userId: String(user.user_id),
        formData,
        submit: false,
      }).unwrap()

      toast.success("Form saved as draft!")
      setTimeout(() => {
        router.push("/learner-forms")
      }, 2000)
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message ===
          "string"
          ? (error as { data: { message: string } }).data.message
          : "Failed to save draft. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsDraftLoading(false)
    }
  }

  const onClear = () => {
    reset(
      fields.reduce((acc, field) => {
        acc[field.id] = field.type === "checkbox" ? [] : ""
        return acc
      }, {} as Record<string, string | string[] | File | undefined>)
    )
  }

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              No fields added to the form.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        {isLocked && (
          <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This form is currently locked and cannot be edited. If you need
                to make changes, please contact your trainer or administrator
                for assistance.
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {fields.map((field) => (
              <div key={field.id} className={widthToClass(field.width)}>
                <Controller
                  name={field.id}
                  control={control}
                  render={({ field: controllerField, fieldState }) => {
                    const error = !!fieldState.error
                    const errorMessage = fieldState.error?.message

                    switch (field.type) {
                      case "text":
                      case "textfield": // API returns "textfield" instead of "text"
                      case "email":
                      case "number":
                      case "phone":
                        return (
                          <div className="space-y-2">
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </Label>
                            <Input
                              {...controllerField}
                              id={field.id}
                              type={
                                field.type === "number"
                                  ? "number"
                                  : field.type === "email"
                                  ? "email"
                                  : "text"
                              }
                              placeholder={field.placeholder}
                              disabled={isLocked}
                              className={error ? "border-destructive" : ""}
                              value={String(controllerField.value || "")}
                            />
                            {errorMessage && (
                              <p className="text-sm text-destructive">
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        )

                      case "textarea":
                        return (
                          <div className="space-y-2">
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </Label>
                            <Textarea
                              {...controllerField}
                              id={field.id}
                              placeholder={field.placeholder}
                              disabled={isLocked}
                              className={error ? "border-destructive" : ""}
                              rows={4}
                              value={String(controllerField.value || "")}
                            />
                            {errorMessage && (
                              <p className="text-sm text-destructive">
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        )

                      case "select":
                        return (
                          <div className="space-y-2">
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </Label>
                            <Select
                              value={String(controllerField.value || "")}
                              onValueChange={controllerField.onChange}
                              disabled={isLocked}
                            >
                              <SelectTrigger
                                id={field.id}
                                className={error ? "border-destructive" : ""}
                              >
                                <SelectValue placeholder={field.placeholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((opt, i) => (
                                  <SelectItem key={i} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errorMessage && (
                              <p className="text-sm text-destructive">
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        )

                      case "radio":
                        return (
                          <div className="space-y-2">
                            <Label>
                              {field.label}
                              {field.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </Label>
                            <RadioGroup
                              value={String(controllerField.value || "")}
                              onValueChange={controllerField.onChange}
                              disabled={isLocked}
                            >
                              {field.options?.map((opt, i) => (
                                <div
                                  key={i}
                                  className="flex items-center space-x-2"
                                >
                                  <RadioGroupItem
                                    value={opt.value}
                                    id={`${field.id}-${i}`}
                                  />
                                  <Label
                                    htmlFor={`${field.id}-${i}`}
                                    className="font-normal cursor-pointer"
                                  >
                                    {opt.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                            {errorMessage && (
                              <p className="text-sm text-destructive">
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        )

                      case "checkbox":
                        return (
                          <div className="space-y-2">
                            <Label>
                              {field.label}
                              {field.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </Label>
                            <div className="space-y-2">
                              {field.options?.map((opt, i) => (
                                <div
                                  key={i}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`${field.id}-${i}`}
                                    checked={
                                      (Array.isArray(controllerField.value) &&
                                        controllerField.value.includes(
                                          opt.value
                                        )) ||
                                      false
                                    }
                                    onCheckedChange={(checked) => {
                                      const valueArr = Array.isArray(
                                        controllerField.value
                                      )
                                        ? controllerField.value
                                        : []
                                      if (checked) {
                                        controllerField.onChange([
                                          ...valueArr,
                                          opt.value,
                                        ])
                                      } else {
                                        controllerField.onChange(
                                          valueArr.filter(
                                            (v) => v !== opt.value
                                          )
                                        )
                                      }
                                    }}
                                    disabled={isLocked}
                                  />
                                  <Label
                                    htmlFor={`${field.id}-${i}`}
                                    className="font-normal cursor-pointer"
                                  >
                                    {opt.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {errorMessage && (
                              <p className="text-sm text-destructive">
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        )

                      case "date":
                        return (
                          <div className="space-y-2">
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </Label>
                            <Input
                              {...controllerField}
                              id={field.id}
                              type="date"
                              disabled={isLocked}
                              className={error ? "border-destructive" : ""}
                              value={
                                controllerField.value &&
                                typeof controllerField.value === "string"
                                  ? new Date(controllerField.value)
                                      .toISOString()
                                      .split("T")[0]
                                  : ""
                              }
                            />
                            {errorMessage && (
                              <p className="text-sm text-destructive">
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        )

                      case "file":
                        return (
                          <FileUploadField
                            name={field.id}
                            control={
                              control as Control<
                                Record<
                                  string,
                                  string | string[] | File | undefined
                                >
                              >
                            }
                            label={field.label}
                            required={field.required}
                            error={errorMessage}
                            disabled={isLocked}
                          />
                        )

                      case "signature":
                        return (
                          <SignatureInput
                            name={field.id}
                            control={
                              control as unknown as Control<
                                Record<
                                  string,
                                  string | string[] | File | undefined
                                >
                              >
                            }
                            label={field.label}
                            required={field.required}
                            error={errorMessage}
                            disabled={
                              isLocked ||
                              (field.signatureRole &&
                                user?.role !== field.signatureRole) ||
                              false
                            }
                          />
                        )

                      default:
                        return (
                          <div className="space-y-2">
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </Label>
                            <Input
                              {...controllerField}
                              id={field.id}
                              placeholder={field.placeholder}
                              disabled={isLocked}
                              className={error ? "border-destructive" : ""}
                              value={String(controllerField.value || "")}
                            />
                            {errorMessage && (
                              <p className="text-sm text-destructive">
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        )
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClear}
              disabled={isLocked || isSubmitting || isDraftLoading || isEmployer}
            >
              Clear Form
            </Button>

            {user?.role === "Learner" && (
              <Button
                type="button"
                variant="outline"
                onClick={onSaveAsDraft}
                disabled={isDraftLoading || isLocked || isSubmitting || isEmployer}
              >
                {isDraftLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Draft"
                )}
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || isLocked || isDraftLoading || isEmployer}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
