"use client";

import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGetFormDetailsQuery } from "@/store/api/forms/formsApi";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { FormFieldsView } from "./form-fields-view";
import type { FormField } from "@/store/api/forms/types";

interface FormViewProps {
  formId: string;
}

export function FormView({ formId }: FormViewProps) {
  const router = useRouter();
  const { data, isLoading, error } = useGetFormDetailsQuery(formId);

  if (error) {
    toast.error("Failed to load form details");
    router.push("/forms");
    return null;
  }

  const form = data?.data;
  const fields = (form?.form_data || form?.fields || []) as FormField[];

  const handleEdit = () => {
    router.push(`/forms/${formId}/builder`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader
          title="View Form"
          subtitle="View form details and structure"
          icon={FileText}
          showBackButton
          backButtonHref="/forms"
        />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader
          title="View Form"
          subtitle="Form not found"
          icon={FileText}
          showBackButton
          backButtonHref="/forms"
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Form not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="View Form"
        subtitle="View form details and structure"
        icon={FileText}
        showBackButton
        backButtonHref="/forms"
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/forms")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Form
        </Button>
      </div>

      {/* Form Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Form Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Form Name
              </label>
              <p className="text-base font-semibold mt-1">{form.form_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <div className="mt-1">
                <Badge variant="secondary">{form.type}</Badge>
              </div>
            </div>
            {form.description && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-base mt-1">{form.description}</p>
              </div>
            )}
            {form.created_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created At
                </label>
                <p className="text-base mt-1">
                  {format(new Date(form.created_at), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            )}
            {form.updated_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Updated At
                </label>
                <p className="text-base mt-1">
                  {format(new Date(form.updated_at), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.access_rights && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Access Rights
                </label>
                <p className="text-base mt-1">{form.access_rights}</p>
              </div>
            )}
            {form.enable_complete_function && form.completion_roles && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Completion Roles
                </label>
                <p className="text-base mt-1">{form.completion_roles}</p>
              </div>
            )}
            {form.set_request_signature && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Request Signature
                </label>
                <p className="text-base mt-1">
                  <Badge variant="outline">Enabled</Badge>
                </p>
              </div>
            )}
            {form.email_roles && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email Recipients
                </label>
                <p className="text-base mt-1">{form.email_roles}</p>
              </div>
            )}
            {form.other_emails && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Other Emails
                </label>
                <p className="text-base mt-1">{form.other_emails}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Form Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <FormFieldsView fields={fields} />
        </CardContent>
      </Card>
    </div>
  );
}

