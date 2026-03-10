"use client";

import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { EvidenceForm } from "./evidence-form";
import { useTranslations } from "next-intl";

export function EvidenceFormPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const isEditMode = id && id !== "new";
  const t = useTranslations("evidenceLibrary");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/evidence-library")}
          className="-ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon("back")}
        </Button>
        <PageHeader
          title={
            isEditMode ? t("form.editTitle") : t("form.createTitle")
          }
          subtitle={
            isEditMode
              ? t("form.editSubtitle")
              : t("form.createSubtitle")
          }
          icon={FileText}
        />
      </div>

      {/* Form */}
      <EvidenceForm evidenceId={isEditMode ? id : undefined} />
    </div>
  );
}

