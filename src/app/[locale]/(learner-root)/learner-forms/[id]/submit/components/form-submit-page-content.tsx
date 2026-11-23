"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DynamicFormRenderer,
  type FormExportApi,
} from "./dynamic-form-renderer";
import { exportLearnerFormToPdf } from "../utils/export-form-pdf";
import { useGetFormDetailsQuery } from "@/store/api/forms/formsApi";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download, FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface FormSubmitPageContentProps {
  formId: string;
}

/** Only allow same-origin relative paths (blocks open redirects). */
function getSafeReturnTo(value: string | null): string {
  if (!value) return "/learner-forms";
  const decoded = decodeURIComponent(value);
  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return "/learner-forms";
  }
  return decoded;
}

export function FormSubmitPageContent({ formId }: FormSubmitPageContentProps) {
  const t = useTranslations("learnerFormSubmit");
  const searchParams = useSearchParams();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const exportApiRef = useRef<FormExportApi | null>(null);

  const backHref = useMemo(
    () => getSafeReturnTo(searchParams.get("returnTo")),
    [searchParams]
  );

  const {
    data: formDetails,
    isLoading,
    error,
  } = useGetFormDetailsQuery(formId, {
    skip: !formId,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  const formName = formDetails?.data?.form_name || t("page.title");
  const formDescription = formDetails?.data?.description || undefined;

  const handleExportApiChange = useCallback((api: FormExportApi | null) => {
    exportApiRef.current = api;
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    const api = exportApiRef.current;
    if (!api) {
      toast.error(t("toast.pdfContentNotFound"));
      return;
    }

    setIsDownloadingPdf(true);
    toast.loading(t("toast.generatingPdf"), { id: "form-pdf-generating" });

    try {
      const snapshot = api.getSnapshot({
        formName,
        description: formDescription,
      });
      await exportLearnerFormToPdf(snapshot);
      toast.success(t("toast.pdfDownloaded"), { id: "form-pdf-generating" });
    } catch (err) {
      console.error("Form PDF export error:", err);
      toast.error(t("toast.pdfDownloadFailed"), { id: "form-pdf-generating" });
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [formDescription, formName, t]);

  const downloadButton = (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownloadPdf}
      disabled={isDownloadingPdf}
    >
      {isDownloadingPdf ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isDownloadingPdf ? t("form.downloadingPdf") : t("form.downloadPdf")}
    </Button>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title={t("page.title")}
          subtitle={t("page.subtitle")}
          icon={FileText}
          showBackButton
          backButtonHref={backHref}
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
          title={t("page.title")}
          subtitle={t("page.subtitle")}
          icon={FileText}
          showBackButton
          backButtonHref={backHref}
        />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive p-4 text-white">
              <AlertCircle className="h-4 w-4 text-white" />
              <p className="text-sm text-destructive">
                {error ? t("page.loadFailed") : t("page.notFound")}
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
        title={formDetails.data.form_name || t("page.title")}
        subtitle={formDetails.data.description || t("page.subtitle")}
        icon={FileText}
        showBackButton
        backButtonHref={backHref}
        actions={downloadButton}
      />
      <DynamicFormRenderer
        formId={formId}
        fields={formDetails.data.form_data || []}
        returnTo={backHref}
        onExportApiChange={handleExportApiChange}
      />
    </div>
  );
}
