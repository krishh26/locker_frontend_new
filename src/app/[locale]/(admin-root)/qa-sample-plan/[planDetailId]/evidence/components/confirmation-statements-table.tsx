"use client";

import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roleKeyMap: Record<string, string> = {
  Learner: "learner",
  Trainer: "trainer",
  "Lead assessor Countersignature (if required)": "leadAssessorCountersignature",
  Employer: "employer",
  IQA: "iqa",
  EQA: "eqa",
};

export interface ConfirmationRow {
  role: string;
  statement: string;
  completed: boolean;
  signedOffBy: string;
  dated: string;
  comments: string;
  file: string;
  assignment_review_id?: number;
}

interface ConfirmationStatementsTableProps {
  confirmationRows: ConfirmationRow[];
  currentUserRole?: string;
  onConfirmationToggle: (index: number) => void;
  onAddComment: (index: number) => void;
  onDeleteFile?: (index: number) => void;
  isDeletingFile?: boolean;
}

export function ConfirmationStatementsTable({
  confirmationRows,
  currentUserRole,
  onConfirmationToggle,
  onAddComment,
  onDeleteFile,
  isDeletingFile,
}: ConfirmationStatementsTableProps) {
  const t = useTranslations("qaSamplePlan.evidence.confirmationStatements");
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">{t("columns.role")}</TableHead>
                <TableHead className="w-[35%]">{t("columns.confirmationStatement")}</TableHead>
                <TableHead className="text-center w-[10%]">
                  {t("columns.tickWhenCompleted")}
                </TableHead>
                <TableHead className="w-[12%]">{t("columns.signedOffBy")}</TableHead>
                <TableHead className="w-[10%]">{t("columns.dated")}</TableHead>
                <TableHead className="w-[13%]">{t("columns.generalComments")}</TableHead>
                <TableHead className="w-[10%]">{t("columns.file")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {confirmationRows.map((row, index) => {
                const canAccess = currentUserRole === row.role;
                const roleKey = roleKeyMap[row.role];
                const roleLabel = roleKey ? t(`roles.${roleKey}`) : row.role;

                return (
                  <TableRow key={index} className="hover:bg-muted">
                    {/* Role */}
                    <TableCell className="font-medium align-top">
                      {roleLabel}
                    </TableCell>

                    {/* Statement */}
                    <TableCell className="align-top max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap" title={row.statement}>{row.statement}</TableCell>

                    {/* Tick + Comment */}
                    <TableCell className="text-center align-top">
                      <div className="flex items-center justify-center gap-1">
                        <Checkbox
                          checked={row.completed}
                          onCheckedChange={() =>
                            canAccess && onConfirmationToggle(index)
                          }
                          disabled={!canAccess}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => canAccess && onAddComment(index)}
                          disabled={!canAccess}
                          className={`h-7 w-7 ${
                            canAccess
                              ? "text-primary hover:bg-primary"
                              : "text-muted-foreground cursor-not-allowed"
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Signed Off By */}
                    <TableCell className="align-top">
                      {row.signedOffBy || t("na")}
                    </TableCell>

                    {/* Dated */}
                    <TableCell className="align-top">{row.dated || t("na")}</TableCell>

                    {/* Comments */}
                    <TableCell className="align-top">
                      {row.comments || t("na")}
                    </TableCell>

                    {/* File Upload */}
                    <TableCell className="align-top">
                      {row.file ? (
                        <div className="flex items-center gap-2">
                          <span className="text-primary text-sm">{row.file}</span>
                          {canAccess && row.assignment_review_id && onDeleteFile && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteFile(index)}
                              disabled={isDeletingFile}
                              className="h-6 w-6 text-destructive hover:text-white hover:bg-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        t("na")
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
