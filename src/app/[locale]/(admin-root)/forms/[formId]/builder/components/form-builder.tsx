"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, Save, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useGetFormDetailsQuery,
  useGetFormsListQuery,
  useCreateFormMutation,
  useUpdateFormMutation,
} from "@/store/api/forms/formsApi";
import type { SimpleFormField } from "@/store/api/forms/types";
import { SimpleFormBuilder } from "./simple-form-builder";
import { FormPreview } from "./form-preview";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";

const roles = [
  "Master Admin",
  "Basic Admin",
  "Assessor",
  "IQA",
  "EQA",
  "Curriculum Manager",
  "Employer Overview",
  "Employer Manager",
  "Partner",
  "Custom Manager",
  "Learner",
] as const;

type Role = (typeof roles)[number];

const formTypeOptions = [
  "ILP",
  "Review",
  "Enrolment",
  "Survey",
  "Workbook",
  "Test/Exams",
  "Others",
];

const metadataSchema = z
  .object({
    form_name: z.string().min(1, "Form name is required"),
    type: z.string().min(1, "Form type is required"),
    description: z.string().optional(),
    accessRights: z.record(z.string(), z.boolean()),
    enableCompleteFunction: z.boolean(),
    completionRoles: z.record(z.string(), z.boolean()).optional(),
    requestSignature: z.boolean(),
    emails: z.record(z.string(), z.boolean()),
    otherEmail: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate access rights
    const hasAccessRight = Object.values(data.accessRights).some((v) => v === true);
    if (!hasAccessRight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one access right",
        path: ["accessRights"],
      });
    }

    // Validate completion roles when enableCompleteFunction is true
    if (data.enableCompleteFunction) {
      const hasCompletionRole = data.completionRoles
        ? Object.values(data.completionRoles).some((v) => v === true)
        : false;
      if (!hasCompletionRole) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one completion role",
          path: ["completionRoles"],
        });
      }
    }

    // Validate emails
    const hasEmail = Object.values(data.emails).some((v) => v === true);
    if (!hasEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one email recipient",
        path: ["emails"],
      });
    }

    // Validate other emails
    const hasOtherEmail = data.emails && "Other" in data.emails && data.emails.Other;
    if (hasOtherEmail && !data.otherEmail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter other emails",
        path: ["otherEmail"],
      });
    }

    if (hasOtherEmail && data.otherEmail) {
      const emails = data.otherEmail.split(",").map((e) => e.trim());
      const allValid = emails.every((email) =>
        /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
      );
      if (!allValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter valid email(s) separated by commas",
          path: ["otherEmail"],
        });
      }
    }
  });

type MetadataFormValues = z.infer<typeof metadataSchema>;

interface FormBuilderProps {
  formId: string | null;
}

export function FormBuilder({ formId }: FormBuilderProps) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;
  const isEmployer = userRole === "Employer";
  
  const isEditMode = formId !== null && formId !== "new";
  const [formFields, setFormFields] = useState<SimpleFormField[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const {
    data: formDetails,
    isLoading: isFormDetailsLoading,
    isError: isFormDetailsError,
  } = useGetFormDetailsQuery(formId!, {
    skip: !isEditMode,
  });

  // Get all forms for duplicate name validation (only used in handleSaveAsForm)
  const { data: allFormsData } = useGetFormsListQuery(
    { page: 1, page_size: 1000 },
    { skip: false, refetchOnMountOrArgChange: false }
  );
  const existingForms = allFormsData?.data || [];

  const [createForm, { isLoading: isCreating }] = useCreateFormMutation();
  const [updateForm, { isLoading: isUpdating }] = useUpdateFormMutation();

  const form = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      form_name: "",
      type: "",
      description: "",
      accessRights: roles.reduce((acc, role) => {
        acc[role] = true;
        return acc;
      }, {} as Record<Role, boolean>),
      enableCompleteFunction: true,
      completionRoles: {},
      emails: roles.reduce((acc, role) => {
        acc[role] = false;
        return acc;
      }, {} as Record<Role, boolean>),
      otherEmail: "",
      requestSignature: false,
    },
  });

  const enableCompleteFunction = form.watch("enableCompleteFunction");

  useEffect(() => {
    if (formDetails?.data && !isFormDetailsLoading) {
      const {
        form_name,
        type,
        description,
        form_data,
        access_rights,
        enable_complete_function,
        completion_roles,
        other_emails,
        set_request_signature,
        email_roles,
      } = formDetails.data;

      const accessRolesArray = access_rights
        ?.split(",")
        .map((role) => role.trim().replace(/^'(.*)'$/, "$1"));

      const completionRolesArray = Array.isArray(completion_roles)
        ? completion_roles
        : typeof completion_roles === 'string'
        ? completion_roles.split(",").map((role) => role.trim().replace(/^'(.*)'$/, "$1"))
        : [];

      const emailRolesArray = Array.isArray(email_roles)
        ? email_roles
        : typeof email_roles === 'string'
        ? email_roles.split(",").map((role) => role.trim().replace(/^'(.*)'$/, "$1"))
        : [];

      form.reset({
        form_name,
        type,
        description: description || "",
        accessRights: Object.fromEntries(
          roles.map((role) => [
            role,
            accessRolesArray?.includes(role) || false,
          ])
        ) as Record<Role, boolean>,
        completionRoles: Object.fromEntries(
          roles.map((role) => [
            role,
            completionRolesArray?.includes(role) || false,
          ])
        ) as Record<Role, boolean>,
        enableCompleteFunction: enable_complete_function || false,
        requestSignature: set_request_signature || false,
        emails: Object.fromEntries(
          roles.map((role) => [
            role,
            emailRolesArray?.includes(role) || false,
          ])
        ) as Record<Role, boolean>,
        otherEmail: other_emails || "",
      });

      if (form_data) {
        setFormFields(form_data);
      }
    }
  }, [formDetails, isFormDetailsLoading, form]);

  const handleSave = async () => {
    const values = form.getValues();

    if (!values.form_name.trim()) {
      toast.error("Please enter a form name");
      return;
    }

    if (formFields.length === 0) {
      toast.error("Please add at least one field to the form");
      return;
    }

    setSaveStatus("saving");

    const formData = {
      form_name: values.form_name,
      description: values.description,
      type: values.type,
      form_data: formFields,
      access_rights: Object.entries(values.accessRights)
        .filter(([, value]) => value)
        .map(([key]) => `'${key}'`)
        .join(","),
      completion_roles: Object.entries(values.completionRoles || {})
        .filter(([, value]) => value)
        .map(([key]) => `'${key}'`)
        .join(","),
      enable_complete_function: values.enableCompleteFunction,
      set_request_signature: values.requestSignature,
      email_roles: Object.entries(values.emails)
        .filter(([, value]) => value)
        .map(([key]) => `'${key}'`)
        .join(","),
      other_emails: values.otherEmail || null,
    };

    try {
      if (isEditMode) {
        await updateForm({ id: formId!, data: formData }).unwrap();
        toast.success("Form updated successfully");
      } else {
        await createForm(formData).unwrap();
        toast.success("Form created successfully");
      }
      setSaveStatus("saved");
      setTimeout(() => router.push("/forms"), 1500);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "Failed to save form");
      setSaveStatus("error");
    }
  };

  const handleSaveAsForm = async () => {
    const values = form.getValues();

    if (!values.form_name.trim()) {
      toast.error("Please enter a form name");
      return;
    }

    if (formFields.length === 0) {
      toast.error("Please add at least one field to the form");
      return;
    }

    // Check for duplicate name (exclude current form if in edit mode)
    const newFormName = values.form_name.trim();
    const existingFormNames = existingForms
      .filter((form) => (isEditMode ? form.id !== formId : true))
      .map((form) => form.form_name?.toLowerCase().trim())
      .filter(Boolean);

    if (existingFormNames.includes(newFormName.toLowerCase())) {
      form.setError("form_name", {
        type: "manual",
        message: "A form with this name already exists. Please choose a different name.",
      });
      toast.error("A form with this name already exists. Please choose a different name.");
      return;
    }

    setSaveStatus("saving");

    const formData = {
      form_name: newFormName,
      description: values.description,
      type: values.type,
      form_data: formFields,
      access_rights: Object.entries(values.accessRights)
        .filter(([, value]) => value)
        .map(([key]) => `'${key}'`)
        .join(","),
      completion_roles: Object.entries(values.completionRoles || {})
        .filter(([, value]) => value)
        .map(([key]) => `'${key}'`)
        .join(","),
      enable_complete_function: values.enableCompleteFunction,
      set_request_signature: values.requestSignature,
      email_roles: Object.entries(values.emails)
        .filter(([, value]) => value)
        .map(([key]) => `'${key}'`)
        .join(","),
      other_emails: values.otherEmail || null,
    };

    try {
      await createForm(formData).unwrap();
      toast.success("Form saved as new form successfully");
      setSaveStatus("saved");
      setTimeout(() => router.push("/forms"), 1500);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "Failed to save form as new");
      setSaveStatus("error");
    }
  };

  const handleCancel = () => {
    router.push("/forms");
  };

  const getFieldCountByType = () => {
    const counts: { [key: string]: number } = {};
    formFields.forEach((field) => {
      counts[field.type] = (counts[field.type] || 0) + 1;
    });
    return counts;
  };

  const fieldCounts = getFieldCountByType();

  if (isFormDetailsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 w-full max-w-2xl p-8">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isFormDetailsError && isEditMode) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <div className="rounded-lg border border-destructive bg-destructive p-4">
          <p className="text-sm text-white">
            Failed to load form details. Please try again.
          </p>
        </div>
        <Button onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {isEditMode ? "Edit Form" : "Create New Form"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Drag components to build your form
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {formFields.length > 0 && (
              <Badge variant="outline">
                {formFields.length} field{formFields.length !== 1 ? "s" : ""}
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              disabled={formFields.length === 0}
            >
              <Eye className="mr-2 h-4 w-4" />
              {isPreviewMode ? "Edit" : "Preview"}
            </Button>
            {(isCreating || isUpdating || saveStatus === "saving") ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </Button>
            ) : (
              <>
                {!isEmployer && (
                  <>
                    {isEditMode && (
                      <Button variant="outline" onClick={handleSaveAsForm}>
                        <Copy className="mr-2 h-4 w-4" />
                        Save As Form
                      </Button>
                    )}
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Form
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>


      {/* Form Metadata Section */}
      <div className="border-b bg-background p-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Form Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>
                  Form Name <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="form_name"
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Input
                        {...field}
                        placeholder="e.g., Customer Feedback Form"
                        className={
                          form.formState.errors.form_name
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.form_name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.form_name.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Form Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={
                            form.formState.errors.type
                              ? "border-destructive"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select form type" />
                        </SelectTrigger>
                        <SelectContent>
                          {formTypeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.type && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.type.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label>Description (Optional)</Label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Describe what this form is for..."
                    rows={2}
                  />
                )}
              />
            </div>

            {formFields.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Form Statistics:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(fieldCounts).map(([type, count]) => (
                    <Badge key={type} variant="outline">
                      {count} {type} field{count > 1 ? "s" : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Access Rights */}
            <div className="space-y-2 mb-4">
              <Label>Access Rights</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {roles.map((role) => (
                  <Controller
                    key={role}
                    name={`accessRights.${role}`}
                    control={form.control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`access-${role}`}
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        <Label
                          htmlFor={`access-${role}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {role}
                        </Label>
                      </div>
                    )}
                  />
                ))}
              </div>
              {form.formState.errors.accessRights && (
                <p className="text-sm text-destructive">
                  {String(form.formState.errors.accessRights.message || "")}
                </p>
              )}
            </div>

            {/* Completion */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="enableCompleteFunction"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="enableComplete"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="enableComplete" className="cursor-pointer">
                  Enable Complete Function
                </Label>
              </div>

              {enableCompleteFunction && (
                <div className="border rounded-lg p-4 ml-6">
                  <Label className="mb-2 block">Completion Roles</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {roles.map((role) => (
                      <Controller
                        key={role}
                        name={`completionRoles.${role}`}
                        control={form.control}
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`completion-${role}`}
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label
                              htmlFor={`completion-${role}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {role}
                            </Label>
                          </div>
                        )}
                      />
                    ))}
                  </div>
                  {form.formState.errors.completionRoles && (
                    <p className="text-sm text-destructive mt-2">
                      {String(form.formState.errors.completionRoles.message || "")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Request Signature */}
            <div className="flex items-center space-x-2 mb-4">
              <Controller
                name="requestSignature"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="requestSignature"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="requestSignature" className="cursor-pointer">
                Set Request Signature
              </Label>
            </div>

            {/* Emails */}
            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {roles.map((role) => (
                  <Controller
                    key={role}
                    name={`emails.${role}`}
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`email-${role}`}
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label
                          htmlFor={`email-${role}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {role}
                        </Label>
                      </div>
                    )}
                  />
                ))}
              </div>
              {(form.watch("emails") as Record<string, boolean>)?.Other && (
                <div className="mt-2">
                  <Controller
                    name="otherEmail"
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Input
                          {...field}
                          placeholder="Emails separated by comma(,)"
                          className={
                            form.formState.errors.otherEmail
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {form.formState.errors.otherEmail && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.otherEmail.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              )}
              {form.formState.errors.emails && (
                <p className="text-sm text-destructive">
                  {String(form.formState.errors.emails.message || "")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Builder or Preview */}
      <div className="flex-1 h-full p-4">
        {isPreviewMode ? (
          <div className="h-full p-4">
            <FormPreview
              fields={formFields}
              formName={form.watch("form_name")}
              description={form.watch("description")}
            />
          </div>
        ) : (
          <SimpleFormBuilder
            initialFields={formFields}
            onChange={setFormFields}
          />
        )}
      </div>
    </div>
  );
}

