"use client";

import { FC, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { School, Download, Archive, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { EvidenceEntry } from "@/store/api/evidence/types";
import type { LearnerCourse } from "@/store/api/learner/types";
import {
  downloadFile,
  downloadFileDirect,
  createZipFile,
  sanitizeFileName,
} from "../../utils/download-helpers";

interface DownloadDialogProps {
  open: boolean;
  onClose: () => void;
  courses: LearnerCourse[];
  selectedCourseForDownload: number | null;
  onCourseSelect: (courseId: number) => void;
  evidenceFiles: EvidenceEntry[];
  isLoadingEvidence: boolean;
  selectedFiles: Set<number>;
  onFileSelection: (fileId: number) => void;
  onSelectAllFiles: () => void;
  isDownloading: boolean;
  selectedCourseName?: string;
}

export const DownloadDialog: FC<DownloadDialogProps> = ({
  open,
  onClose,
  courses,
  selectedCourseForDownload,
  onCourseSelect,
  evidenceFiles,
  isLoadingEvidence,
  selectedFiles,
  onFileSelection,
  onSelectAllFiles,
  isDownloading: externalIsDownloading,
  selectedCourseName,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  // Transform courses to options (filter out Gateway courses)
  const courseOptions = useMemo(() => {
    return courses
      .map((courseItem) => {
        const course = courseItem.course || courseItem;
        if (course?.course_id && course.course_core_type !== "Gateway") {
          return {
            course_id: course.course_id,
            course_name: course.course_name,
            course_code: course.course_code,
          };
        }
        return null;
      })
      .filter((course): course is NonNullable<typeof course> => course !== null)
      .sort((a, b) => a.course_name.localeCompare(b.course_name));
  }, [courses]);

  const allFilesSelected =
    evidenceFiles.length > 0 &&
    evidenceFiles.every((evidence) => selectedFiles.has(evidence.assignment_id));

  // Handle download with ZIP creation
  const handleDownload = async () => {
    if (selectedFiles.size === 0) {
      toast.warning("Please select at least one file to download");
      return;
    }

    setIsDownloading(true);
    
    try {
      // Filter evidence with selected files
      const evidenceWithFiles = evidenceFiles.filter(
        (evidence) =>
          evidence.file && selectedFiles.has(evidence.assignment_id)
      );

      if (evidenceWithFiles.length === 0) {
        toast.warning("No files found for selected files");
        setIsDownloading(false);
        return;
      }

      // Download all files with error handling
      const downloadPromises = evidenceWithFiles.map(async (evidence) => {
        const fileName =
          evidence.file?.name || `evidence_${evidence.assignment_id}.pdf`;
        try {
          const blob = await downloadFile(evidence.file!.url, fileName);

          // Validate the blob
          if (!blob || blob.size === 0) {
            throw new Error("Downloaded file is empty or invalid");
          }

          // Check if the file content matches the expected type
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const extension = fileName.split(".").pop()?.toLowerCase();

          // Validate file signatures for common types
          let isValidFile = true;
          if (extension === "pdf") {
            // PDF files start with %PDF
            const isPDF =
              uint8Array.length >= 4 &&
              uint8Array[0] === 0x25 && // %
              uint8Array[1] === 0x50 && // P
              uint8Array[2] === 0x44 && // D
              uint8Array[3] === 0x46; // F
            if (!isPDF) {
              console.warn(`File ${fileName} appears to not be a valid PDF`);
              isValidFile = false;
            }
          } else if (extension === "jpg" || extension === "jpeg") {
            // JPEG files start with FF D8
            const isJPEG =
              uint8Array.length >= 2 &&
              uint8Array[0] === 0xff &&
              uint8Array[1] === 0xd8;
            if (!isJPEG) {
              console.warn(`File ${fileName} appears to not be a valid JPEG`);
              isValidFile = false;
            }
          } else if (extension === "png") {
            // PNG files start with 89 50 4E 47
            const isPNG =
              uint8Array.length >= 4 &&
              uint8Array[0] === 0x89 &&
              uint8Array[1] === 0x50 &&
              uint8Array[2] === 0x4e &&
              uint8Array[3] === 0x47;
            if (!isPNG) {
              console.warn(`File ${fileName} appears to not be a valid PNG`);
              isValidFile = false;
            }
          }

          if (!isValidFile) {
            console.warn(
              `File ${fileName} may not be a valid ${extension} file, but will still be included`
            );
          }

          return {
            name: fileName,
            blob: blob,
            success: true,
          };
        } catch (error) {
          console.warn(
            `Failed to download ${fileName}, will try direct download:`,
            error
          );
          // Fallback to direct download
          downloadFileDirect(evidence.file!.url, fileName);
          return {
            name: fileName,
            blob: null,
            success: false,
            url: evidence.file!.url,
          };
        }
      });

      const results = await Promise.all(downloadPromises);

      // Filter successful downloads for ZIP creation
      const successfulFiles = results.filter(
        (result) => result.success && result.blob
      );
      const failedFiles = results.filter((result) => !result.success);

      // Show warning for failed downloads
      if (failedFiles.length > 0) {
        toast.warning(
          `${failedFiles.length} files opened in new tabs due to CORS restrictions`
        );
      }

      // Only create ZIP if we have successful downloads
      if (successfulFiles.length === 0) {
        toast.info(
          "All files opened in new tabs. ZIP download not available due to CORS restrictions."
        );
        setIsDownloading(false);
        return;
      }

      // If we have both successful and failed files, show a warning
      if (failedFiles.length > 0 && successfulFiles.length > 0) {
        toast.warning(
          `Downloaded ${successfulFiles.length} files as ZIP. ${failedFiles.length} files opened in new tabs due to CORS restrictions.`
        );
      }

      const files = successfulFiles.map((result) => ({
        name: result.name,
        blob: result.blob!,
      }));

      // Create ZIP file
      // Note: Requires jszip package - install with: npm install jszip @types/jszip
      const zipBlob = await createZipFile(files);

      // Validate ZIP file
      if (!zipBlob || zipBlob.size === 0) {
        throw new Error("Failed to create ZIP file");
      }

      console.log(`Created ZIP file with size: ${zipBlob.size} bytes`);
      console.log(`Files in ZIP: ${files.map((f) => f.name).join(", ")}`);

      // Test ZIP file by trying to read it
      try {
        const testZip = new (await import("jszip")).default();
        await testZip.loadAsync(zipBlob);
        console.log("ZIP file validation successful");
      } catch (zipError) {
        console.error("ZIP file validation failed:", zipError);
        throw new Error("Created ZIP file is corrupted");
      }

      // Download ZIP file
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;

      // Create a more descriptive filename
      const timestamp = new Date().toISOString().split("T")[0];
      const courseName = selectedCourseName
        ? selectedCourseName.replace(/\s+/g, "_")
        : "";

      const zipFileName = courseName
        ? `Evidence_Files_${courseName}_${timestamp}.zip`
        : `Evidence_Library_${timestamp}.zip`;

      link.download = sanitizeFileName(zipFileName);

      // Add some additional attributes for better compatibility
      link.setAttribute("download", sanitizeFileName(zipFileName));
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(
        `Successfully downloaded ${files.length} selected evidence files`
      );
      
      // Close dialog after successful download
      onClose();
    } catch (error) {
      console.error("Error downloading files:", error);
      toast.error("Failed to download evidence files. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Download Evidence Files
          </DialogTitle>
          <DialogDescription>
            Select a course to view and download its evidence files
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Course List */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b">
              <Label className="text-sm font-semibold">Select Course</Label>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {courseOptions.map((course) => (
                  <button
                    key={course.course_id}
                    onClick={() => onCourseSelect(course.course_id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
                      selectedCourseForDownload === course.course_id
                        ? "bg-primary border border-primary text-white"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium text-sm">{course.course_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Code: {course.course_code}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Side - Evidence Files */}
          <div className="w-2/3 flex flex-col">
            {selectedCourseForDownload ? (
              <>
                <div className="p-4 border-b flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={allFilesSelected}
                    onCheckedChange={onSelectAllFiles}
                  />
                  <Label
                    htmlFor="select-all"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Select All Files
                  </Label>
                </div>
                <ScrollArea className="flex-1">
                  {isLoadingEvidence ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Loading evidence...</p>
                    </div>
                  ) : evidenceFiles.length > 0 ? (
                    <div className="p-2">
                      {evidenceFiles.map((evidence) => (
                        <div
                          key={evidence.assignment_id}
                          onClick={() => onFileSelection(evidence.assignment_id)}
                          className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                            selectedFiles.has(evidence.assignment_id)
                              ? "bg-primary border border-primary text-white"
                              : "hover:bg-accent border border-transparent"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={selectedFiles.has(evidence.assignment_id)}
                              onCheckedChange={() =>
                                onFileSelection(evidence.assignment_id)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {evidence.title || `Evidence ${evidence.assignment_id}`}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {evidence.file?.name || "No file name"}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {evidence.status || "Unknown"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                      <School className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No evidence files found for this course
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <School className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Course</h3>
                  <p className="text-muted-foreground">
                    Choose a course from the list to view its evidence files
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={selectedFiles.size === 0 || isDownloading || externalIsDownloading}
          >
            {isDownloading || externalIsDownloading ? (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download ({selectedFiles.size} file
                {selectedFiles.size !== 1 ? "s" : ""})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

