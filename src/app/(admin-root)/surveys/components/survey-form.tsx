"use client"

import { useEffect } from "react"
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
import { toast } from "sonner"

const surveyFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(["Draft", "Published"]),
})

type SurveyFormValues = z.infer<typeof surveyFormSchema>

interface SurveyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  survey?: Survey | null
}

export function SurveyForm({ open, onOpenChange, survey }: SurveyFormProps) {
  const [createSurvey, { isLoading: isCreating }] = useCreateSurveyMutation()
  const [updateSurvey, { isLoading: isUpdating }] = useUpdateSurveyMutation()

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "Draft",
    },
  })

  useEffect(() => {
    if (survey) {
      form.reset({
        name: survey.name,
        description: survey.description || "",
        status: survey.status === "Archived" ? "Draft" : survey.status,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        status: "Draft",
      })
    }
  }, [survey, form])

  async function onSubmit(data: SurveyFormValues) {
    try {
      if (survey) {
        await updateSurvey({
          surveyId: survey.id,
          updates: {
            name: data.name,
            description: data.description,
            status: data.status,
          },
        }).unwrap()
        toast.success("Survey updated successfully")
      } else {
        await createSurvey({
          name: data.name,
          description: data.description,
          status: data.status,
        }).unwrap()
        toast.success("Survey created successfully")
      }
      form.reset()
      onOpenChange(false)
    } catch (error: unknown) {
      // Handle RTK Query error format
      // Error structure: { status: 403, data: { message: "...", status: false } }
      let errorMessage = survey ? "Failed to update survey" : "Failed to create survey"
      
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
          <DialogTitle>{survey ? "Edit Survey" : "Create Survey"}</DialogTitle>
          <DialogDescription>
            {survey
              ? "Update the survey details. Click save when you're done."
              : "Create a new survey form. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter survey name" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter survey description (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
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
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={!form.formState.isValid || isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? (survey ? "Updating..." : "Creating...")
                  : (survey ? "Update Survey" : "Create Survey")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

