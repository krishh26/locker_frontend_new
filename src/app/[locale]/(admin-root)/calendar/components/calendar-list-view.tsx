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
import { useUpdateSessionMutation, useDeleteSessionMutation } from "@/store/api/session/sessionApi";
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
  const [updateSession] = useUpdateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();
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
        data: { Attended: newStatus },
      }).unwrap();
      toast.success("Session status updated successfully");
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string } })?.data?.error || "Failed to update session status";
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
      await deleteSession(sessionToDelete.session_id).unwrap();
      toast.success("Session deleted successfully");
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string } })?.data?.error || "Failed to delete session";
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
      <Card className="p-12 bg-linear-to-br from-rose-50/40 to-pink-50/40 dark:from-rose-950/20 dark:to-pink-950/15 border-rose-200/40 dark:border-rose-800/20">
        <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
          <div className="rounded-full bg-linear-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/30 p-4">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-lg font-semibold">No data found</p>
          <p className="text-sm text-center">
            No sessions scheduled. Sessions will appear here once they are created.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-linear-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-950/15 dark:to-orange-950/10 border-amber-200/40 dark:border-amber-800/20">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20">
                <TableHead>Title</TableHead>
                <TableHead>Learners</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-center">Attended</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.session_id}>
                  <TableCell>{session.title || "Untitled Session"}</TableCell>
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
                        <SelectItem value="Not Set">Not Set</SelectItem>
                        <SelectItem value="Attended">Attended</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="Cancelled by Assessor">
                          Cancelled by Assessor
                        </SelectItem>
                        <SelectItem value="Cancelled by Learner">
                          Cancelled by Learner
                        </SelectItem>
                        <SelectItem value="Cancelled by Employer">
                          Cancelled by Employer
                        </SelectItem>
                        <SelectItem value="Learner Late">Learner Late</SelectItem>
                        <SelectItem value="Assessor Late">Assessor Late</SelectItem>
                        <SelectItem value="Learner not Attended">
                          Learner not Attended
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
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(session)}
                          className="text-destructive"
                        >
                          Delete
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
              Page {metaData.page} of {metaData.pages} ({metaData.items} total items)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(metaData.page - 1)}
                disabled={metaData.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(metaData.page + 1)}
                disabled={metaData.page >= metaData.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this session will also remove all associated data and relationships. Proceed with deletion?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Session
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

