"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session, SessionMetaData } from "@/store/api/session/types";
import { useUpdateSessionMutation, useDeleteLearnerPlanMutation } from "@/store/api/learner-plan/learnerPlanApi";
import { toast } from "sonner";
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
import { SessionDialog } from "./session-dialog";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface CalendarListViewProps {
  sessions: Session[];
  isLoading?: boolean;
  metaData?: SessionMetaData;
  onPageChange: (page: number) => void;
}

export function CalendarListView({
  sessions,
  isLoading,
  metaData,
  onPageChange,
}: CalendarListViewProps) {
  const t = useTranslations("calendar");
  const [updateSession] = useUpdateSessionMutation();
  const [deleteLearnerPlan] = useDeleteLearnerPlanMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return date.substring(0, 10);
  };

  const handleStatusChange = async (sessionId: number, newStatus: string) => {
    try {
      await updateSession({
        id: sessionId,
        Attended: newStatus,
      }).unwrap();
      toast.success(t("list.toastStatusUpdated"));
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string } })?.data?.error ||
        t("list.toastStatusUpdateFailed");
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteLearnerPlan(sessionToDelete.session_id).unwrap();
      toast.success(t("list.toastDeleteSuccess"));
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string } })?.data?.error ||
        t("list.toastDeleteFailed");
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="p-12 bg-muted border-border">
        <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
          <div className="rounded-full bg-primary p-4">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-lg font-semibold">
            {t("list.emptyTitle")}
          </p>
          <p className="text-sm text-center">
            {t("list.emptyDescription")}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/10">
                <TableHead>{t("list.headers.title")}</TableHead>
                <TableHead>{t("list.headers.learners")}</TableHead>
                <TableHead>{t("list.headers.trainer")}</TableHead>
                <TableHead>{t("list.headers.location")}</TableHead>
                <TableHead>{t("list.headers.visitDate")}</TableHead>
                <TableHead>{t("list.headers.duration")}</TableHead>
                <TableHead className="text-center">
                  {t("list.headers.attended")}
                </TableHead>
                <TableHead>{t("list.headers.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.session_id}>
                  <TableCell>
                    {session.title || t("list.untitledSession")}
                  </TableCell>
                  <TableCell>
                    {session.learners
                      ?.map((learner) => learner.user_name)
                      .join(", ") || "-"}
                  </TableCell>
                  <TableCell>{session.trainer_id?.user_name || "-"}</TableCell>
                  <TableCell>{session.location || "-"}</TableCell>
                  <TableCell>{formatDate(session.startDate)}</TableCell>
                  <TableCell>{session.Duration || "-"}</TableCell>
                  <TableCell>
                    <Select
                      value={session.Attended || "Not Set"}
                      onValueChange={(value) =>
                        handleStatusChange(session.session_id, value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Set">
                          {t("status.notSet")}
                        </SelectItem>
                        <SelectItem value="Attended">
                          {t("status.attended")}
                        </SelectItem>
                        <SelectItem value="Cancelled">
                          {t("status.cancelled")}
                        </SelectItem>
                        <SelectItem value="Cancelled by Assessor">
                          {t("status.cancelledByAssessor")}
                        </SelectItem>
                        <SelectItem value="Cancelled by Learner">
                          {t("status.cancelledByLearner")}
                        </SelectItem>
                        <SelectItem value="Cancelled by Employer">
                          {t("status.cancelledByEmployer")}
                        </SelectItem>
                        <SelectItem value="Learner Late">
                          {t("status.learnerLate")}
                        </SelectItem>
                        <SelectItem value="Assessor Late">
                          {t("status.assessorLate")}
                        </SelectItem>
                        <SelectItem value="Learner not Attended">
                          {t("status.learnerNotAttended")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSessionToEdit(session);
                            setEditDialogOpen(true);
                          }}
                        >
                            {t("list.actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(session)}
                          className="text-destructive"
                        >
                            {t("list.actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {metaData && metaData.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {t("list.pagination.pageOf", {
                page: metaData.page,
                pages: metaData.pages,
              })}{" "}
              ({t("list.pagination.totalItems", { count: metaData.items })})
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(metaData.page - 1)}
                disabled={metaData.page <= 1}
              >
                {t("list.pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(metaData.page + 1)}
                disabled={metaData.page >= metaData.pages}
              >
                {t("list.pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("list.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("list.deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>
              {t("list.deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("list.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Session Dialog */}
      <SessionDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSessionToEdit(null);
          }
        }}
        session={sessionToEdit || undefined}
        onSuccess={() => {
          setSessionToEdit(null);
          onPageChange(metaData?.page || 1);
        }}
      />
    </>
  );
}

