"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileCategorySummary } from "./file-category-summary";
import { ManageSessionFilesDialog } from "./manage-session-files-dialog";
import { AddActionDialog } from "./add-action-dialog";
import { ManageActionFileDialog } from "./manage-action-file-dialog";
import { FileText, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { LearningPlanSession, SessionActionDetail } from "@/store/api/learner-plan/types";
import { useAppSelector } from "@/store/hooks";

interface SessionExpandedContentProps {
  session: LearningPlanSession;
  units: Array<{
    unit_id: string | number | null;
    unit_name: string | null;
  }>;
  courses: string;
  description?: string;
  userRole?: string;
  onRefresh?: () => void;
}

export function SessionExpandedContent({
  session,
  units,
  courses,
  description,
  userRole,
  onRefresh,
}: SessionExpandedContentProps) {
  const t = useTranslations("learningPlan");
  const user = useAppSelector((state) => state.auth.user);
  const isEmployer = user?.role === "Employer";
  const [isFilesDialogOpen, setIsFilesDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<SessionActionDetail | null>(null);
  const [actionFileDialogOpen, setActionFileDialogOpen] = useState<number | null>(null);
  const actionDetails = session.sessionLearnerActionDetails || [];

  return (
    <div className="p-6 space-y-6">
      {/* Course Header */}
      <div>
        <h3 className="font-bold text-lg">{courses || t("sessionExpanded.noCourses")}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* File Summary and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <FileCategorySummary data={session.learnerPlanDocuments} />
        <div className="flex items-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsFilesDialogOpen(true)}
            disabled={isEmployer}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("sessionExpanded.buttons.addFiles")}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setEditingAction(null);
              setIsActionDialogOpen(true);
            }}
            disabled={isEmployer}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("sessionExpanded.buttons.addAction")}
          </Button>
        </div>
      </div>

      {/* Action Plans Table */}
      {actionDetails.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("sessionExpanded.actionTable.headers.who")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.action")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.description")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.file")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.units")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.targetDate")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.feedback")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.duration")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.status")}</TableHead>
                <TableHead>{t("sessionExpanded.actionTable.headers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionDetails.map((action) => {
                const who =
                  action.who === "learner" ||
                  action.who === "assessor" ||
                  action.sessionLearner === "sessionLearner"
                    ? t("sessionExpanded.actionTable.whoLabels.learner")
                    : action.employer
                    ? t("sessionExpanded.actionTable.whoLabels.employer")
                    : action.who;

                const unitName = action.unit
                  ? units.find(
                      (u) => String(u.unit_id) === String(action.unit)
                    )?.unit_name || action.unit
                  : null;

                return (
                  <TableRow key={action.action_id}>
                    <TableCell className="text-sm">{who}</TableCell>
                    <TableCell className="text-sm">
                      {action.action_name || t("common.dash")}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {action.action_description || t("common.dash")}
                    </TableCell>
                    <TableCell>
                      {action.file_attachment ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <a
                                  href={action.file_attachment.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{action.file_attachment.file_name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        t("common.dash")
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {unitName ? t("sessionExpanded.actionTable.unitPrefix", { unitName }) : t("common.dash")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {action.target_date
                        ? format(new Date(action.target_date), "dd/MM/yyyy")
                        : t("common.dash")}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px]">
                      <div className="space-y-1">
                        {action.trainer_feedback && (
                          <div>
                            <strong>{t("sessionExpanded.actionTable.feedbackLabels.trainer")}</strong>{" "}
                            {action.trainer_feedback}
                          </div>
                        )}
                        {action.learner_feedback && (
                          <div>
                            <strong>{t("sessionExpanded.actionTable.feedbackLabels.learner")}</strong>{" "}
                            {action.learner_feedback}
                          </div>
                        )}
                        {!action.trainer_feedback && !action.learner_feedback && (
                          <span>{t("common.dash")}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {action.time_spent
                        ? t("sessionExpanded.actionTable.mins", { count: action.time_spent })
                        : t("common.dash")}
                    </TableCell>
                    <TableCell>
                      {action.status === false ||
                      action.learner_status === "not started" ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isEmployer}
                              >
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("sessionExpanded.actionTable.notStarted")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        t("common.dash")
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingAction(action);
                                  setIsActionDialogOpen(true);
                                }}
                                disabled={isEmployer}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("sessionExpanded.actionTable.tooltips.edit")}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setActionFileDialogOpen(action.action_id);
                                }}
                                disabled={isEmployer}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("sessionExpanded.actionTable.tooltips.addFile")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {(userRole === "Admin" || userRole === "Trainer") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    toast.info(
                                      t("sessionExpanded.actionTable.toast.deleteNotImplemented")
                                    );
                                  }}
                                  disabled={isEmployer}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("sessionExpanded.actionTable.tooltips.delete")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <ManageSessionFilesDialog
        open={isFilesDialogOpen}
        onClose={() => setIsFilesDialogOpen(false)}
        learnerPlanId={session.learner_plan_id}
        onSuccess={onRefresh}
      />

      <AddActionDialog
        open={isActionDialogOpen}
        onClose={() => {
          setIsActionDialogOpen(false);
          setEditingAction(null);
        }}
        learnerPlanId={session.learner_plan_id}
        units={units}
        onSuccess={onRefresh}
        editAction={editingAction}
        userRole={userRole}
      />

      {actionFileDialogOpen !== null && (
        <ManageActionFileDialog
          open={actionFileDialogOpen !== null}
          onClose={() => setActionFileDialogOpen(null)}
          actionId={actionFileDialogOpen}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

