"use client";

import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";;
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { EvidenceForm } from "./evidence-form";

export function EvidenceFormPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const isEditMode = id && id !== "new";

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
          Back
        </Button>
        <PageHeader
          title={isEditMode ? "Edit Evidence" : "Create Evidence"}
          subtitle={
            isEditMode
              ? "Update evidence details and mappings"
              : "Add new evidence to your library"
          }
          icon={FileText}
        />
      </div>

      {/* Form */}
      <EvidenceForm evidenceId={isEditMode ? id : undefined} />
    </div>
  );
}

