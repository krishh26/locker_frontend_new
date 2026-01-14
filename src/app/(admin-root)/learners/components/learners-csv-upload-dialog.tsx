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
  const headers = [
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
  ];

  const csvContent = [headers]
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

  const requiredFields = ["FirstNames", "Surname", "Courses"];

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError("");

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<string, string>>) => {
        const rows = results.data as Record<string, string>[];

        // Validation for required fields
        const invalidRow = rows.find((row) =>
          requiredFields.some(
            (field) => !row[field] || row[field].toString().trim() === ""
          )
        );

        if (invalidRow) {
          setError(
            "Some learner details are missing. Please check that every row includes First Names, Surname, and Courses."
          );
          setParsedData([]);
        } else {
          setError("");
          setParsedData(
            rows.map((row) => {
              return {
                first_name: row["FirstNames"],
                last_name: row.Surname,
                courses: row.Courses
                  ? row.Courses.split(",").map((course: string) => {
                      return {
                        start_date: convertDateFormat(row.StartDate),
                        course_name: course.trim(),
                        end_date: convertDateFormat(row.ExpectedEnd),
                        trainer_name: row.TrainerFullName,
                        iqa_name: row.IQAFullName,
                        employer_name: row?.EmployeeFullName || "",
                      };
                    })
                  : [],
                user_name: `${row["FirstNames"]?.toLowerCase() || ""}_${
                  row.Surname?.toLowerCase() || ""
                }`
                  .replace(/\s+/g, "_")
                  .replace(/^_+|_+$/g, ""),
                email: row.Email || "",
                mobile: row.Mobile || "",
                password: generatePassword(
                  row["FirstNames"],
                  row.Surname,
                  row.Mobile
                ),
                confirmPassword: generatePassword(
                  row["FirstNames"],
                  row.Surname,
                  row.Mobile
                ),
                national_ins_no: row.NINumber || "",
                funding_body: "",
                employer_name: row?.EmployeeFullName || "",
              };
            })
          );
        }
      },
      error: (error: Error) => {
        setError(`Error parsing CSV file: ${error.message}`);
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
      setError("No valid data found. Please upload a proper CSV file.");
      return;
    }

    const payload = {
      learners: parsedData,
    };

    try {
      const response = await bulkCreateLearners(payload).unwrap();
      if (response.status) {
        toast.success("Learners uploaded successfully");
        onSuccess();
        onOpenChange(false);
        setFile(null);
        setParsedData([]);
        setError("");
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "Failed to upload learners");
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Learner CSV</DialogTitle>
          <DialogDescription>
            Upload learner data in bulk using CSV format
          </DialogDescription>
        </DialogHeader>

        {/* Sample CSV Download */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-lg">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg mb-2">
                  Need a sample CSV?
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                  Download our template with all required fields and sample data
                  to ensure proper formatting
                </p>
              </div>
            </div>
            <Button
              onClick={downloadSampleCSV}
              className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Sample CSV
            </Button>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-blue-400 dark:border-blue-500 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-linear-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10"
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
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
              <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          {file ? (
            <div className="space-y-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {file.name}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  File size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Drag and drop your CSV file here or{" "}
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  Browse
                </span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                Max 10MB files are allowed
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Upload className="w-5 h-5" />
                Supported format: CSV only
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-linear-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-800 p-2 rounded-lg">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* File Info */}
        {file && parsedData.length > 0 && (
          <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
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
                <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                  <span className="font-bold text-lg">{parsedData.length}</span>{" "}
                  learners found and ready to upload
                </p>
                <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                  All required fields are properly formatted
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
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || parsedData.length === 0 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Uploading..." : "Upload Learners"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

