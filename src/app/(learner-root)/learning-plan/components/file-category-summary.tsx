"use client";

import { FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

type UploadType = "File Upload" | "Form Selection";

interface DocumentEntry {
  document_id: number;
  file_type: string;
  upload_type: UploadType;
  name?: string;
  uploaded_files?: Array<{
    file_name: string;
    file_size: number;
    file_url: string;
    s3_key: string;
    uploaded_at: string;
  }> | null;
  selected_form?: {
    id: number;
    form_name: string;
  } | null;
}

interface FileCategorySummaryProps {
  data?: DocumentEntry[] | null;
}

const categories = [
  "ILP File",
  "Assessment Files",
  "Review Files",
  "General Files",
  "Evidence",
];

export function FileCategorySummary({ data }: FileCategorySummaryProps) {
  const router = useRouter();

  if (!data || data.length === 0) {
    return (
      <div className="border rounded-lg p-4 w-full max-w-[250px] bg-muted/50">
        <p className="text-sm text-muted-foreground">No documents available</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 w-full max-w-[250px] bg-muted/50">
      <TooltipProvider>
        {categories.map((category, idx) => {
          const categoryDocs = data.filter((doc) => doc.file_type === category);
          if (categoryDocs.length === 0) return null;

          return (
            <div key={idx} className="mb-4 last:mb-0">
              <p className="text-sm font-semibold mb-2">
                {idx + 1}. {category.replace(" Files", "")}:
              </p>
              <div className="flex gap-1 flex-wrap">
                {categoryDocs.map((doc) => {
                  if (
                    doc.upload_type === "File Upload" &&
                    doc.uploaded_files &&
                    doc.uploaded_files.length > 0
                  ) {
                    return doc.uploaded_files.map((file, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <File className="h-4 w-4 text-red-600" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{file.file_name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ));
                  }

                  if (
                    doc.upload_type === "Form Selection" &&
                    doc.selected_form
                  ) {
                    return (
                      <Tooltip key={doc.document_id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              router.push(
                                `/learner-forms/${doc.selected_form!.id}/submit`
                              )
                            }
                          >
                            <FileText className="h-4 w-4 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{doc.selected_form.form_name}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

