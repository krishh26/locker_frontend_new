"use client";

import { useState, useRef } from "react";
import { Upload, X, Download, Loader2 } from "lucide-react";
import Papa, { ParseResult } from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBulkCreateLearnersMutation } from "@/store/api/learner/learnerApi";
import type { BulkCreateLearnerRequest } from "@/store/api/learner/types";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const learnerCsvHeaders = [
  "FirstNames",
  "Surname",
  "Email",
  "Mobile",
  "NINumber",
  "Courses",
  "StartDate",
  "ExpectedEnd",
  "TrainerFullName",
  "EmployeeFullName",
  "IQAFullName",
  "CentreName",
  "FundingBody",
  "JobTitle",
] as const;

const requiredLearnerCsvFields = [
  "FirstNames",
  "Surname",
  "Email",
  "Mobile",
  "Courses",
  "EmployeeFullName",
  "CentreName",
  "FundingBody",
  "JobTitle",
] as const;

const requiredLearnerCsvFieldSet = new Set<string>(requiredLearnerCsvFields);

const requiredLearnerCsvFieldLabels: Record<(typeof requiredLearnerCsvFields)[number], string> = {
  FirstNames: "First Names",
  Surname: "Surname",
  Email: "Email",
  Mobile: "Mobile",
  Courses: "Courses",
  EmployeeFullName: "Employee",
  CentreName: "CentreName",
  FundingBody: "FundingBody",
  JobTitle: "JobTitle",
};

const normalizeCsvHeader = (header: string) => header.replace(/\*+$/g, "").trim();

// Function to convert date from DD-MM-YYYY to YYYY-MM-DD format
const convertDateFormat = (dateString: string): string => {
  if (!dateString || typeof dateString !== "string") return dateString;

  // Check if the date is already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Convert from DD-MM-YYYY to YYYY-MM-DD
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return dateString;
};

// Function to generate password for learners
const generatePassword = (
  firstName: string,
  surname: string,
  mobile: string
): string => {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || "U";
  const surnameInitial = surname?.charAt(0)?.toUpperCase() || "U";

  // Extract last 4 digits from mobile number
  const mobileDigits = mobile?.replace(/\D/g, "") || "0000";
  const lastFourDigits = mobileDigits.slice(-4).padStart(4, "0");

  // Create password pattern: FirstInitial + SurnameInitial + Last4Digits + @
  // Example: John Smith with mobile 1234567890 becomes "JS7890@"
  return `${firstInitial}${surnameInitial}${lastFourDigits}@`;
};

// Function to download sample CSV
const downloadSampleCSV = () => {
  const headers = learnerCsvHeaders.map((header) =>
    requiredLearnerCsvFieldSet.has(header) ? `${header}*` : header
  );

  // Example row for template usage (values are placeholders; users must replace with DB-matching names).
  const exampleRow = [
    "John",
    "Smith",
    "john.smith@example.com",
    "07123456789",
    "AB123456C",
    "Course A,Course B",
    "01-01-2026",
    "31-12-2026",
    "Trainer One",
    "Employer One",
    "IQA One",
    "phoenix centre 1",
    "Advance Learning Loan",
    "Job title example",
  ];

  const csvContent = [headers, exampleRow]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "learner_sample.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface LearnersCsvUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LearnersCsvUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: LearnersCsvUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BulkCreateLearnerRequest[]>([]);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkCreateLearners, { isLoading }] = useBulkCreateLearnersMutation();

  const t = useTranslations("learners.csvUpload");

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError("");

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeCsvHeader(header),
      complete: (results: ParseResult<Record<string, string>>) => {
        const rows = results.data as Record<string, string>[];

        // Validation for required fields
        const invalidRow = rows.find((row) =>
          requiredLearnerCsvFields.some(
            (field) => !row[field] || row[field].toString().trim() === ""
          )
        );

        if (invalidRow) {
          setError(
            t(
              "errors.missingRequiredFields",
              {
                fields: requiredLearnerCsvFields
                  .map((field) => requiredLearnerCsvFieldLabels[field])
                  .join(", "),
              }
            )
          );
          setParsedData([]);
        } else {
          setError("");
          setParsedData(
            rows.map((row) => {
              const firstNames = (row["FirstNames"] ?? "").toString().trim();
              const lastName = (row.Surname ?? "").toString().trim();
              const email = (row.Email ?? "").toString().trim();
              const mobile = (row.Mobile ?? "").toString().trim();
              const centreName = (row.CentreName ?? "").toString().trim();
              const fundingBody = (row.FundingBody ?? "").toString().trim();
              const jobTitle = (row.JobTitle ?? "").toString().trim();
              const ninNumber = (row.NINumber ?? "").toString().trim();
              const trainerFullName = (row.TrainerFullName ?? "").toString().trim();
              const iqaFullName = (row.IQAFullName ?? "").toString().trim();
              const employerFullName = (row?.EmployeeFullName ?? "")
                .toString()
                .trim();

              const coursesList = (row.Courses ?? "")
                .toString()
                .split(",")
                .map((course: string) => course.trim())
                .filter(Boolean);

              const startRaw = (row.StartDate ?? "").toString().trim();
              const expectedEndRaw = (row.ExpectedEnd ?? "").toString().trim();
              const startDate = startRaw ? convertDateFormat(startRaw) : undefined;
              const expectedEnd = expectedEndRaw
                ? convertDateFormat(expectedEndRaw)
                : undefined;

              const generatedPassword = generatePassword(
                firstNames,
                lastName,
                mobile,
              );

              return {
                first_name: firstNames,
                last_name: lastName,
                courses: coursesList.map((course) => ({
                  start_date: startDate,
                  course_name: course,
                  end_date: expectedEnd,
                  trainer_name: trainerFullName,
                  iqa_name: iqaFullName,
                  employer_name: employerFullName,
                })),
                user_name: `${firstNames.toLowerCase()}_${lastName.toLowerCase()}`
                  .replace(/\s+/g, "_")
                  .replace(/^_+|_+$/g, ""),
                email,
                mobile,
                password: generatedPassword,
                confirmPassword: generatedPassword,
                national_ins_no: ninNumber,
                funding_body: fundingBody,
                job_title: jobTitle,
                centre_name: centreName,
                employer_name: employerFullName,
              };
            })
          );
        }
      },
      error: (error: Error) => {
        setError(
          t("errors.parseError", {
            message: error.message,
          })
        );
        setParsedData([]);
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      handleFileSelect(droppedFile);
    } else {
      setError("Please upload a CSV file");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (parsedData.length === 0) {
      setError(t("errors.noValidData"));
      return;
    }

    const payload = {
      learners: parsedData,
    };

    try {
      const response = await bulkCreateLearners(payload).unwrap();
      type BulkUploadRowError = {
        message?: string;
        error?: string;
        row?: number;
        index?: number;
      };
      type BulkUploadBackendResult = {
        status?: boolean;
        message?: string;
        data?: {
          errors?: BulkUploadRowError[];
        };
      };

      const backend = response as BulkUploadBackendResult;
      const backendMessage: string | undefined = backend?.message;
      const rowErrors: BulkUploadRowError[] = backend?.data?.errors ?? [];

      if (backend?.status) {
        if (rowErrors.length > 0) {
          const preview = rowErrors
            .slice(0, 3)
            .map((e, idx) => {
              const row = e.row != null ? e.row : idx + 1;
              const msg = e.message ?? e.error ?? "Failed";
              return `Row ${row}: ${msg}`;
            })
            .join(" | ");

          toast.warning(
            `${backendMessage ?? t("toast.success")}. ${rowErrors.length} failed. ${preview}`,
          );
        } else {
          toast.success(backendMessage ?? t("toast.success"));
        }

        onSuccess();
        onOpenChange(false);
        setFile(null);
        setParsedData([]);
        setError("");
      }
    } catch (error: unknown) {
      type BulkUploadRowError = {
        message?: string;
        error?: string;
        row?: number;
        index?: number;
      };
      type BulkUploadErrorPayload = {
        message?: string;
        data?: {
          errors?: BulkUploadRowError[];
        };
        errors?: BulkUploadRowError[];
      };
      type RtqUnwrapError = {
        data?: BulkUploadErrorPayload;
      };

      const errData: BulkUploadErrorPayload | undefined = (error as RtqUnwrapError)
        ?.data;
      const errorMessage: string | undefined = errData?.message;
      const rowErrors: BulkUploadRowError[] =
        errData?.data?.errors ?? errData?.errors ?? [];

      if (rowErrors.length > 0) {
        const preview = rowErrors
          .slice(0, 3)
          .map((e, idx) => {
            const row = e.row ?? e.index ?? idx + 1;
            const msg = e.message ?? e.error ?? "Failed";
            return `Row ${row}: ${msg}`;
          })
          .join(" | ");

        toast.error(
          `${errorMessage ?? t("toast.failedGeneric")}. ${rowErrors.length} failed. ${preview}`,
        );
        return;
      }

      toast.error(errorMessage || t("toast.failedGeneric"));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFile(null);
      setParsedData([]);
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {/* Sample CSV Download */}
        <div className=" border border-primary rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="bg-white/10 p-3 rounded-lg">
                <Download className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg mb-2">
                  {t("sample.title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("sample.description")}
                </p>
              </div>
            </div>
            <Button
              onClick={downloadSampleCSV}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("sample.button")}
            </Button>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-primary bg-primary"
              : "border-muted-foreground/30 hover:border-primary hover:bg-primary"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex justify-center mb-6">
            <div className="bg-muted p-4 rounded-full">
              <Upload className="w-16 h-16 text-muted-foreground" />
            </div>
          </div>
          {file ? (
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-accent">
                <p className="text-lg font-semibold">
                  {file.name}
                </p>
                <p className="text-sm text-accent">
                  {t("upload.fileSize", {
                    size: (file.size / 1024 / 1024).toFixed(2),
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                {t("upload.dragDrop") + " "}
                <span className="text-primary font-bold">
                  {t("upload.browse")}
                </span>
              </h3>
              <p className="text-muted-foreground text-base">
                {t("upload.maxSize")}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Upload className="w-5 h-5" />
                {t("upload.supportedFormats")}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive border border-destructive rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </div>
              <p className="text-destructive text-sm font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* File Info */}
        {file && parsedData.length > 0 && (
          <div className="border border-accent rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg
                  className="w-5 h-5 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-accent text-sm font-medium">
                  <span className="font-bold text-lg">{parsedData.length}</span>{" "}
                  {t("summary.ready")}
                </p>
                <p className="text-accent text-xs mt-1">
                  {t("summary.formatted")}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || parsedData.length === 0 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t("actions.uploading") : t("actions.upload")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

