"use client";

import { Info, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAcknowledgementsQuery } from "@/store/api/acknowledgement/acknowledgementApi";
import { Separator } from "@/components/ui/separator";

interface AcknowledgementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onAccept: () => void;
  learnerName: string;
}

export function AcknowledgementDialog({
  open,
  onOpenChange,
  onClose,
  onAccept,
  learnerName,
}: AcknowledgementDialogProps) {
  const { data, isLoading } = useGetAcknowledgementsQuery(undefined as unknown as void,{
    skip: !open,
  });

  // Get the latest acknowledgement
  const latestAcknowledgement =
    data?.data && data.data.length > 0 ? data.data[0] : null;

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Don't show dialog if no acknowledgement
  if (!isLoading && !latestAcknowledgement) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                Acknowledgement Message
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Welcome {learnerName} to YourLocker Platform
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : latestAcknowledgement ? (
            <>
              {/* Message Section */}
              <div className="space-y-2">
                <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word">
                  {latestAcknowledgement.message}
                </p>
              </div>

              {/* File Section */}
              {latestAcknowledgement.fileName && latestAcknowledgement.filePath && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      Please Review the Attached Document
                    </h4>
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() =>
                        handleDownloadFile(
                          latestAcknowledgement.filePath!,
                          latestAcknowledgement.fileName!
                        )
                      }
                    >
                      <Download className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-primary underline hover:no-underline">
                        {latestAcknowledgement.fileName}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onAccept} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "I Accept"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

