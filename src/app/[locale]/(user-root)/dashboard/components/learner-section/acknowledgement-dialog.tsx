"use client";

import { useEffect, useRef, useCallback } from "react";
import { Info, Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGetAcknowledgementsQuery } from "@/store/api/acknowledgement/acknowledgementApi";
import { Separator } from "@/components/ui/separator";
import { useUpdateLearnerMutation, useLazyGetLearnerDetailsQuery } from "@/store/api/learner/learnerApi";
import { useAppDispatch } from "@/store/hooks";
import { setLearnerData } from "@/store/slices/authSlice";
import { toast } from "sonner";

interface AcknowledgementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerId: number | undefined;
  learnerName: string;
  organisationId?: number;
  centreId?: number;
}

export function AcknowledgementDialog({
  open,
  onOpenChange,
  learnerId,
  learnerName,
  organisationId,
  centreId,
}: AcknowledgementDialogProps) {
  const t = useTranslations("learnerDashboard.acknowledgementDialog");
  const dispatch = useAppDispatch();
  const queryFilters =
    organisationId != null
      ? { organisation_id: organisationId, centre_id: centreId }
      : undefined;
  const { data, isLoading, isFetching } = useGetAcknowledgementsQuery(queryFilters ?? undefined, {
    skip: !open,
  });
  const [updateLearner, { isLoading: isUpdating }] = useUpdateLearnerMutation();
  const [getLearnerDetails, { isLoading: isFetchingLearner }] = useLazyGetLearnerDetailsQuery();

  const latestAcknowledgement =
    data?.data && data.data.length > 0 ? data.data[0] : null;

  /** No modal/skeleton until we know we have a row to show */
  const awaitingFirstResponse =
    open && !latestAcknowledgement && (isLoading || (isFetching && data === undefined));

  const emptyDismissRef = useRef(false);

  const isProcessing = isUpdating || isFetchingLearner;

  const handleClose = useCallback(async () => {
    if (learnerId) {
      try {
        await updateLearner({
          id: learnerId,
          data: {
            isShowMessage: false,
          },
        }).unwrap();

        const learnerResponse = await getLearnerDetails(learnerId).unwrap();
        if (learnerResponse?.data) {
          dispatch(setLearnerData({
            ...learnerResponse.data,
            role: 'Learner',
          }));
        }

        onOpenChange(false);
      } catch (error) {
        const errorMessage =
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.error ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.message ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.message ||
          t("toast.failed");
        toast.error(errorMessage);
      }
    } else {
      onOpenChange(false);
    }
  }, [learnerId, updateLearner, getLearnerDetails, dispatch, onOpenChange, t]);

  // API settled with no acknowledgement: clear flag and parent open state — no UI shown
  useEffect(() => {
    if (!open) {
      emptyDismissRef.current = false;
      return;
    }
    if (latestAcknowledgement) return;
    if (isLoading || isFetching) return;
    if (emptyDismissRef.current) return;
    emptyDismissRef.current = true;
    void handleClose();
  }, [open, latestAcknowledgement, isLoading, isFetching, handleClose]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
    } else {
      void handleClose();
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAccept = async () => {
    if (learnerId) {
      try {
        await updateLearner({
          id: learnerId,
          data: {
            isShowMessage: false,
          },
        }).unwrap();

        const learnerResponse = await getLearnerDetails(learnerId).unwrap();
        if (learnerResponse?.data) {
          dispatch(setLearnerData({
            ...learnerResponse.data,
            role: 'Learner',
          }));
        }

        onOpenChange(false);
        toast.success(t("toast.success"));
      } catch (error) {
        const errorMessage =
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.error ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.message ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.message ||
          t("toast.failed");
        toast.error(errorMessage);
      }
    } else {
      onOpenChange(false);
    }
  };

  if (!open) {
    return null;
  }

  if (awaitingFirstResponse || !latestAcknowledgement) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {t("welcomeMessage", { name: learnerName })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word">
              {latestAcknowledgement.message}
            </p>
          </div>

          {latestAcknowledgement.fileName && latestAcknowledgement.filePath && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  {t("reviewDocument")}
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
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => void handleClose()} disabled={isProcessing}>
            {t("cancel")}
          </Button>
          <Button onClick={() => void handleAccept()} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              t("accept")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
