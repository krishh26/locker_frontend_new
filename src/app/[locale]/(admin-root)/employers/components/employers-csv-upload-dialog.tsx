"use client";

import { useState, useRef } from "react";
import { Upload, X, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBulkCreateEmployersMutation } from "@/store/api/employer/employerApi";
import type { CreateEmployerRequest } from "@/store/api/employer/types";
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

// Function to download sample CSV
const downloadSampleCSV = () => {
  const headers = [
    "CompanyName",
    "MSIEmployerID",
    "BusinessDepartment",
    "BusinessLocation",
    "BranchCode",
    "Address1",
    "Address2",
    "City",
    "County",
    "Country",
    "Postcode",
    "BusinessCategory",
    "NumberOfEmployees",
    "Telephone",
    "Website",
    "KeyContactName",
    "KeyContactNumber",
    "Email",
    "BusinessDescription",
    "Comments",
    "AssessmentDate",
    "AssessmentRenewalDate",
    "InsuranceRenewalDate",
  ];

  const sampleData = [
    "ABC Company Ltd - Test",
    "MSI001",
    "IT Department",
    "London Office",
    "LON001",
    "123 Business Street",
    "Suite 100",
    "London",
    "Greater London",
    "United Kingdom",
    "SW1A 1AA",
    "IT and telecommunications services",
    "50-100",
    "+44 20 7123 4567",
    "https://www.abccompany.com",
    "John Smith",
    "+44 20 7123 4568",
    "contactTest@abccompany.com",
    "Leading technology solutions provider",
    "Regular client with good payment history",
    "01-01-2024",
    "01-01-2025",
    "01-01-2025",
  ];

  const csvContent = [headers, sampleData]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "employer_sample.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface EmployersCsvUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmployersCsvUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: EmployersCsvUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Omit<CreateEmployerRequest, "file">[]>([]);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkCreateEmployers, { isLoading }] = useBulkCreateEmployersMutation();

  const requiredFields = ["CompanyName", "MSIEmployerID"];

  const parseCSV = (csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        setError("CSV file must contain at least a header row and one data row");
        setParsedData([]);
        return;
      }

      // Parse header
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));

      // Parse data rows
      const rows: Omit<CreateEmployerRequest, "file">[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(",")
          .map((v) => v.trim().replace(/^"|"$/g, ""));

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        // Validate required fields
        const invalidField = requiredFields.find(
          (field) => !row[field] || row[field].toString().trim() === ""
        );

        if (invalidField) {
          setError(
            `Row ${i + 1}: Missing required field "${invalidField}". Please check that every row includes Company Name and MSIEmployerID.`
          );
          setParsedData([]);
          return;
        }

        // Map CSV columns to API fields
        rows.push({
          employer_name: row["CompanyName"] || "",
          msi_employer_id: row["MSIEmployerID"] || "",
          business_department: row["BusinessDepartment"] || "",
          business_location: row["BusinessLocation"] || "",
          branch_code: row["BranchCode"] || "",
          address_1: row["Address1"] || "",
          address_2: row["Address2"] || "",
          city: row["City"] || "",
          employer_county: row["County"] || "",
          country: row["Country"] || "",
          postal_code: row["Postcode"] || "",
          business_category: row["BusinessCategory"] || "",
          number_of_employees: row["NumberOfEmployees"] || "",
          telephone: row["Telephone"] || "",
          website: row["Website"] || "",
          key_contact_name: row["KeyContactName"] || "",
          key_contact_number: row["KeyContactNumber"] || "",
          email: row["Email"] || "",
          business_description: row["BusinessDescription"] || "",
          comments: row["Comments"] || "",
          assessment_date: convertDateFormat(row["AssessmentDate"] || ""),
          assessment_renewal_date: convertDateFormat(row["AssessmentRenewalDate"] || ""),
          insurance_renewal_date: convertDateFormat(row["InsuranceRenewalDate"] || ""),
        });
      }

      setError("");
      setParsedData(rows);
    };

    reader.onerror = () => {
      setError("Failed to read CSV file");
      setParsedData([]);
    };

    reader.readAsText(csvFile);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setParsedData([]);
      setError("");
      return;
    }

    // Validate file type
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
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
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || parsedData.length === 0) {
      setError("No valid data found. Please upload a proper CSV file.");
      return;
    }

    try {
      await bulkCreateEmployers({ employers: parsedData }).unwrap();
      toast.success(`Successfully uploaded ${parsedData.length} employers.`);
      onSuccess();
      onOpenChange(false);
      // Reset state
      setFile(null);
      setParsedData([]);
      setError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "File upload failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Employer CSV</DialogTitle>
          <DialogDescription>
            Upload employer data in bulk using CSV format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sample CSV Download */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg mb-2">
                    Need a sample CSV?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Download our template with all required fields and sample data to
                    ensure proper formatting
                  </p>
                </div>
              </div>
              <Button
                onClick={downloadSampleCSV}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Sample CSV
              </Button>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Upload CSV File</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    handleFileChange(selectedFile);
                  }
                }}
                className="hidden"
              />
              <div className="flex justify-center mb-6">
                <div className="bg-muted p-4 rounded-full">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              {file ? (
                <div className="space-y-3">
                  <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                    <p className="text-lg font-semibold text-accent">
                      {file.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    Drag and drop your CSV file here or{" "}
                    <span className="text-primary font-bold">
                      Browse
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-base">
                    Max 10MB files are allowed
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-2 rounded-lg">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-destructive text-sm font-medium">
                {error}
              </p>
            </div>
          </div>
          )}

          {/* File Info */}
          {file && parsedData.length > 0 && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-2 rounded-lg">
                <Download className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-accent text-sm font-medium">
                  <span className="font-bold text-lg">{parsedData.length}</span> employers
                  found and ready to upload
                </p>
                <p className="text-accent/80 text-xs mt-1">
                  All required fields are properly formatted
                </p>
              </div>
            </div>
          </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFile(null);
              setParsedData([]);
              setError("");
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
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
            Upload Employers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

