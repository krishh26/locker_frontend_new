"use client";

import { DynamicFormRenderer } from "./dynamic-form-renderer";
import { useGetFormDetailsQuery } from "@/store/api/forms/formsApi";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText } from "lucide-react";

interface FormSubmitPageContentProps {
  formId: string;
}

export function FormSubmitPageContent({ formId }: FormSubmitPageContentProps) {
  const {
    data: formDetails,
    isLoading,
    error,
  } = useGetFormDetailsQuery(formId,{
    skip: !formId,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title="Submit Form"
          subtitle="Fill out the form below"
          icon={FileText}
          showBackButton
          backButtonHref="/learner-forms"
        />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !formDetails?.data) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title="Submit Form"
          subtitle="Fill out the form below"
          icon={FileText}
          showBackButton
          backButtonHref="/learner-forms"
        />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-4">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                {error
                  ? "Failed to load form. Please try again."
                  : "Form not found."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={formDetails.data.form_name || "Submit Form"}
        subtitle={formDetails.data.description || "Fill out the form below"}
        icon={FileText}
        showBackButton
        backButtonHref="/learner-forms"
      />
      <DynamicFormRenderer
        formId={formId}
        fields={formDetails.data.form_data || []}
      />
    </div>
  );
}

