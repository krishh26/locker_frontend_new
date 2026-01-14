"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Upload, X, Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useCreateAcknowledgementMutation,
  useGetAcknowledgementsQuery,
  useUpdateAcknowledgementMutation,
  useDeleteAcknowledgementMutation,
  useClearAllAcknowledgementsMutation,
} from "@/store/api/acknowledgement/acknowledgementApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fileTypes = ["PDF", "CSV", "DOC", "DOCX"];
const maxFileSize = 10 * 1024 * 1024; // 10MB

const acknowledgementSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message must be at most 1000 characters"),
  file: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => {
        if (!file) return true;
        return file.size <= maxFileSize;
      },
      { message: "File size must be less than 10MB" }
    )
    .refine(
      (file) => {
        if (!file) return true;
        const extension = file.name.split(".").pop()?.toUpperCase();
        return extension && fileTypes.includes(extension);
      },
      { message: "Only PDF, CSV, DOC, DOCX files are allowed" }
    ),
});

type AcknowledgementFormData = z.infer<typeof acknowledgementSchema>;

export function AcknowledgeMessagePageContent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useGetAcknowledgementsQuery();
  const [createAcknowledgement, { isLoading: isCreating }] =
    useCreateAcknowledgementMutation();
  const [updateAcknowledgement, { isLoading: isUpdating }] =
    useUpdateAcknowledgementMutation();
  const [deleteAcknowledgement, { isLoading: isDeleting }] =
    useDeleteAcknowledgementMutation();
  const [clearAllAcknowledgements, { isLoading: isClearing }] =
    useClearAllAcknowledgementsMutation();

  const latestAcknowledgement =
    data?.data && data.data.length > 0 ? data.data[0] : null;

  const form = useForm<AcknowledgementFormData>({
    resolver: zodResolver(acknowledgementSchema),
    mode: "onChange",
    defaultValues: {
      message: "",
      file: undefined,
    },
  });

  // Load existing acknowledgement data
  useEffect(() => {
    if (latestAcknowledgement) {
      form.reset({
        message: latestAcknowledgement.message || "",
        file: undefined,
      });
      if (latestAcknowledgement.filePath) {
        setExistingFileUrl(latestAcknowledgement.filePath);
      }
    } else {
      form.reset({
        message: "",
        file: undefined,
      });
      setExistingFileUrl(null);
      setSelectedFile(null);
    }
  }, [latestAcknowledgement, form]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const extension = file.name.split(".").pop()?.toUpperCase();
      if (!extension || !fileTypes.includes(extension)) {
        toast.error("Only PDF, CSV, DOC, DOCX files are allowed");
        return;
      }
      if (file.size > maxFileSize) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      form.setValue("file", file);
      setExistingFileUrl(null); // Clear existing file when new file is selected
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    form.setValue("file", undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const extension = file.name.split(".").pop()?.toUpperCase();
      if (!extension || !fileTypes.includes(extension)) {
        toast.error("Only PDF, CSV, DOC, DOCX files are allowed");
        return;
      }
      if (file.size > maxFileSize) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      form.setValue("file", file);
      setExistingFileUrl(null);
    }
  };

  const handleSubmit = async (formData: AcknowledgementFormData) => {
    try {
      const submitFormData = new FormData();
      submitFormData.append("message", formData.message);

      if (latestAcknowledgement) {
        // Update existing acknowledgement
        if (selectedFile && selectedFile.size > 0) {
          submitFormData.append("file", selectedFile);
        }

        await updateAcknowledgement({
          id: latestAcknowledgement.id,
          data: submitFormData,
        }).unwrap();

        toast.success("Message updated successfully!");
      } else {
        // Create new acknowledgement
        if (selectedFile) {
          submitFormData.append("file", selectedFile);
        }

        await createAcknowledgement(submitFormData).unwrap();

        toast.success("Message acknowledged successfully!");
      }

      refetch();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to acknowledge message. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!latestAcknowledgement) {
      form.reset();
      return;
    }

    try {
      await deleteAcknowledgement({ id: latestAcknowledgement.id }).unwrap();
      toast.success("Acknowledgement deleted successfully!");
      form.reset();
      setSelectedFile(null);
      setExistingFileUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to delete acknowledgement. Please try again.";
      toast.error(errorMessage);
    }
    setDeleteDialogOpen(false);
  };

  const handleClearAll = async () => {
    try {
      await clearAllAcknowledgements().unwrap();
      toast.success("All learner acknowledgments cleared successfully!");
      form.reset();
      setSelectedFile(null);
      setExistingFileUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to clear acknowledgments. Please try again.";
      toast.error(errorMessage);
    }
    setClearAllDialogOpen(false);
  };

  const displayFile = selectedFile || (latestAcknowledgement?.fileName && existingFileUrl);

  const isLoadingState = isCreating || isUpdating || isClearing || isDeleting;

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Acknowledge Message"
        subtitle="Create and manage acknowledgement messages for learners"
        icon={MessageSquare}
      />

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      {!isLoading && (
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Enter your acknowledgement message..."
                  rows={6}
                  maxLength={1000}
                  {...form.register("message")}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  {form.formState.errors.message && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.message.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground ml-auto">
                    {form.watch("message")?.length || 0} / 1000 characters
                  </p>
                </div>
              </div>

              <div className="border-t" />

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Upload File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.csv,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-12 cursor-pointer
                    transition-all hover:shadow-md
                    flex flex-col items-center justify-center
                    min-h-[200px]
                    ${
                      form.formState.errors.file
                        ? "border-destructive"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }
                  `}
                >
                  {displayFile ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center">
                        <Upload className="h-12 w-12 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-sm">
                          {selectedFile
                            ? selectedFile.name
                            : latestAcknowledgement?.fileName}
                        </p>
                        {selectedFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileRemove();
                            }}
                          >
                            <X className="h-4 w-4 mr-0" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop your files here or{" "}
                        <span className="text-primary underline">Browse</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Max 10MB files are allowed (PDF, CSV, DOC, DOCX)
                      </p>
                    </div>
                  )}
                </div>
                {form.formState.errors.file && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.file.message}
                  </p>
                )}

                {/* View Current File Button */}
                {latestAcknowledgement?.filePath &&
                  !selectedFile &&
                  existingFileUrl && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(existingFileUrl, "_blank");
                        }}
                        disabled={isLoadingState}
                      >
                        <Download className="h-4 w-4 mr-0" />
                        View Current File
                      </Button>
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isLoadingState || !latestAcknowledgement}
                >
                  <Trash2 className="h-4 w-4 mr-0" />
                  Clear
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setClearAllDialogOpen(true)}
                  disabled={isLoadingState}
                >
                  {isClearing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-0 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-0" />
                      Clear all learner acknowledgment
                    </>
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={isLoadingState || !form.formState.isValid}
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-0" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Acknowledgement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this acknowledgement? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCurrent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Learner Acknowledgments</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all learner acknowledgments? This
              action will remove all acknowledgments from all learners and cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
