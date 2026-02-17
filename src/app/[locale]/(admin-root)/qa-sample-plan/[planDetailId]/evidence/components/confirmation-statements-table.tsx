"use client";

import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const DEFAULT_CONFIRMATION_ROWS: ConfirmationRow[] = [
  {
    role: "Learner",
    statement:
      "I confirm that this unit is complete and the evidence provided is a result of my own work",
    completed: false,
    signedOffBy: "",
    dated: "",
    comments: "",
    file: "",
  },
  {
    role: "Trainer",
    statement:
      "I confirm that the learner has demonstrated competence by satisfying all the skills and knowledge for this unit, and has been assessed according to requirements of the qualification.",
    completed: false,
    signedOffBy: "",
    dated: "",
    comments: "",
    file: "",
  },
  {
    role: "Lead assessor Countersignature (if required)",
    statement:
      "I confirm that the learner has demonstrated competence by satisfying all the skills and knowledge for this unit, and has been assessed according to requirements of the qualification.",
    completed: false,
    signedOffBy: "",
    dated: "",
    comments: "",
    file: "",
  },
  {
    role: "Employer",
    statement:
      "I can confirm that the evidence I have checked as an employer meets the standards.",
    completed: false,
    signedOffBy: "",
    dated: "",
    comments: "",
    file: "",
  },
  {
    role: "IQA",
    statement:
      "I can confirm that the evidence I have sampled as an Internal Quality Assurer meets the standards.",
    completed: false,
    signedOffBy: "",
    dated: "",
    comments: "",
    file: "",
  },
  {
    role: "EQA",
    statement: "Verified as part of External QA Visit.",
    completed: false,
    signedOffBy: "",
    dated: "",
    comments: "",
    file: "",
  },
];

export function ConfirmationStatementsTable({
  confirmationRows = DEFAULT_CONFIRMATION_ROWS,
  currentUserRole,
  onConfirmationToggle,
  onAddComment,
  onDeleteFile,
  isDeletingFile,
}: ConfirmationStatementsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Role</TableHead>
                <TableHead className="w-[35%]">Confirmation Statement</TableHead>
                <TableHead className="text-center w-[10%]">
                  Please tick when completed
                </TableHead>
                <TableHead className="w-[12%]">Signed off by</TableHead>
                <TableHead className="w-[10%]">Dated</TableHead>
                <TableHead className="w-[13%]">General Comments</TableHead>
                <TableHead className="w-[10%]">File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {confirmationRows.map((row, index) => {
                const canAccess = currentUserRole === row.role;

                return (
                  <TableRow key={index} className="hover:bg-muted">
                    {/* Role */}
                    <TableCell className="font-medium align-top">
                      {row.role}
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
                      {row.signedOffBy || "-"}
                    </TableCell>

                    {/* Dated */}
                    <TableCell className="align-top">{row.dated || "-"}</TableCell>

                    {/* Comments */}
                    <TableCell className="align-top">
                      {row.comments || "-"}
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
                        "-"
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
