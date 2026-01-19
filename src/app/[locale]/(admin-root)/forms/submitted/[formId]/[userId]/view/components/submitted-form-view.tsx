"use client";

import { useRouter } from "@/i18n/navigation";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGetFormDataDetailsQuery } from "@/store/api/forms/formsApi";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SubmittedFormFieldsView } from "./submitted-form-fields-view";
import type { FormField } from "@/store/api/forms/types";

interface SubmittedFormViewProps {
  formId: string;
  userId: string;
}

export function SubmittedFormView({ formId, userId }: SubmittedFormViewProps) {
  const router = useRouter();
  const { data, isLoading, error } = useGetFormDataDetailsQuery({
    formId,
    userId,
  });

  if (error) {
    toast.error("Failed to load submitted form details");
    router.back();
    return null;
  }

  const formDataDetails = data?.data;
  const form = formDataDetails?.form;
  const fields = (form?.form_data || []) as FormField[];
  const submittedData = formDataDetails?.form_data || {};
  const submittedFiles = formDataDetails?.form_files || null;

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader
          title="View Submitted Form"
          subtitle="View submitted form with user responses"
          icon={FileText}
          showBackButton
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

  if (!formDataDetails || !form) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader
          title="View Submitted Form"
          subtitle="Submitted form not found"
          icon={FileText}
          showBackButton
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Submitted form not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="View Submitted Form"
        subtitle="View submitted form with user responses"
        icon={FileText}
        showBackButton
      />

      {/* Form Preview with Submitted Data */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{form.form_name || "Untitled Form"}</h2>
            {form.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </div>
          <SubmittedFormFieldsView
            fields={fields}
            submittedData={submittedData}
            submittedFiles={submittedFiles}
          />
        </CardContent>
      </Card>
    </div>
  );
}

