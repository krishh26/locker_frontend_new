"use client";

import { FileText, Download, Eye, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import type { EvidenceItem } from "@/store/api/qa-sample-plan/types";

interface MappedSubUnit {
  id: number | string;
  subTitle: string;
  learnerMapped?: boolean;
  review?: {
    signed_off: boolean;
    signed_at?: string;
    signed_by?: {
      user_id: number;
      name: string;
    };
  } | null;
}

interface UnitToDisplay {
  id: string | number;
  code: string;
  title: string;
  unit_code: string | number;
  learnerMapped?: boolean;
  trainerMapped?: boolean;
}

interface EvidenceTableProps {
  evidenceList: EvidenceItem[];
  planDetailId: string;
  unitCode: string | null;
  onRefresh: () => void;
  // New props for enhanced functionality
  expandedRows: Record<string, boolean>;
  criteriaSignOff: Record<string, boolean>;
  mappedSubUnitsChecked: Record<string, boolean>;
  lockedCheckboxes: Set<string>;
  iqaCheckedCheckboxes: Set<string>;
  allUnitsToDisplay: UnitToDisplay[];
  hasExpandedRows: boolean;
  currentUserRole: string;
  onToggleAllRows: () => void;
  onCriteriaToggle: (refNo: string) => void;
  onMappedSubUnitToggle: (subUnitId: number | string, assignmentId?: number) => void;
  onOpenCommentModal?: (evidence: EvidenceItem) => void;
  createStateKey: (assignmentId: number | undefined, subUnitId: string | number) => string;
}

export function EvidenceTable({
  evidenceList,
  planDetailId,
  unitCode,
  onRefresh,
  expandedRows,
  criteriaSignOff,
  mappedSubUnitsChecked,
  lockedCheckboxes,
  iqaCheckedCheckboxes,
  allUnitsToDisplay,
  hasExpandedRows,
  currentUserRole,
  onToggleAllRows,
  onCriteriaToggle,
  onMappedSubUnitToggle,
  onOpenCommentModal,
  createStateKey,
}: EvidenceTableProps) {
  const handleViewFile = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownloadFile = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Evidence Documents ({evidenceList.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ref No</TableHead>
                <TableHead>Evidence Documents</TableHead>
                <TableHead>Evidence Name</TableHead>
                <TableHead>Evidence Description</TableHead>
                <TableHead>Assessment Method</TableHead>
                <TableHead>Date Uploaded</TableHead>
                <TableHead className="text-center">Sign off all criteria</TableHead>
                {hasExpandedRows &&
                  allUnitsToDisplay.map((unit) => (
                    <TableHead
                      key={unit.id}
                      className="text-center min-w-[100px]"
                      title={unit.title}
                    >
                      {unit.code}
                    </TableHead>
                  ))}
                <TableHead
                  className={`text-center cursor-pointer ${hasExpandedRows ? "" : "border-l-0"}`}
                  onClick={onToggleAllRows}
                >
                  {hasExpandedRows ? "Show Less" : "Show All"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidenceList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8 + (hasExpandedRows ? allUnitsToDisplay.length : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No evidence records available
                  </TableCell>
                </TableRow>
              ) : (
                evidenceList.map((evidence) => {
                  const refNo = String(evidence.assignment_id);
                  const isExpanded = expandedRows[refNo] || false;
                  const mappedSubUnits = evidence.mappedSubUnits || [];

                  return (
                    <TableRow key={evidence.assignment_id} className="hover:bg-muted">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {refNo}
                          {onOpenCommentModal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onOpenCommentModal(evidence)}
                              className="h-6 w-6"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {evidence.file?.url ? (
                          <a
                            href={evidence.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {evidence.file.name || "-"}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            {evidence.file?.name || "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {evidence.title || "-"}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {evidence.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {evidence.assessment_method &&
                          evidence.assessment_method.length > 0 ? (
                            evidence.assessment_method.map((method) => (
                              <Badge key={method} variant="secondary" className="text-xs">
                                {method}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {evidence.created_at
                          ? format(new Date(evidence.created_at), "dd MMM yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={(() => {
                            if (criteriaSignOff[refNo]) return true;
                            if (!evidence?.mappedSubUnits) return false;
                            const trainerMappedSubUnits = evidence.mappedSubUnits.filter(
                              (sub) => sub.trainerMapped === true
                            );
                            // Only check if there are trainer-mapped units AND all are signed off
                            return (
                              trainerMappedSubUnits.length > 0 &&
                              trainerMappedSubUnits.every(
                                (sub) => sub.review?.signed_off === true
                              )
                            );
                          })()}
                          onCheckedChange={() => onCriteriaToggle(refNo)}
                          disabled={
                            currentUserRole !== "IQA" ||
                            !evidence?.mappedSubUnits ||
                            (() => {
                              const trainerMappedSubUnits = evidence.mappedSubUnits.filter(
                                (sub) => sub.trainerMapped === true
                              );
                              // Disable if no trainer-mapped units OR all are already signed off
                              return (
                                trainerMappedSubUnits.length === 0 ||
                                trainerMappedSubUnits.every(
                                  (sub) => sub.review?.signed_off === true
                                )
                              );
                            })()
                          }
                        />
                      </TableCell>
                      {hasExpandedRows &&
                        allUnitsToDisplay.map((unit) => {
                          const evidenceSubUnit = isExpanded
                            ? mappedSubUnits.find((su) => String(su.id) === String(unit.id))
                            : null;

                          // Unit is not in evidence data
                          const isUnitNotInEvidence = !evidenceSubUnit;

                          const stateKey = createStateKey(
                            evidence?.assignment_id,
                            evidenceSubUnit?.id || unit.id
                          );

                          const isChecked = evidenceSubUnit
                            ? evidenceSubUnit.review?.signed_off === true ||
                              (evidenceSubUnit.trainerMapped === true) ||
                              (mappedSubUnitsChecked[stateKey] === true)
                            : false;

                          const isLocked = lockedCheckboxes.has(stateKey);
                          const isIqaChecked = iqaCheckedCheckboxes.has(stateKey);
                          const isIQA = currentUserRole === "IQA";
                          // IQA can only check if trainerMapped is true
                          const canIqaCheck = isIQA && evidenceSubUnit?.trainerMapped === true;
                          // Disable if unit is not in evidence, locked, trainerMapped is false, or user is not IQA
                          const isDisabled =
                            isUnitNotInEvidence ||
                            isLocked ||
                            !evidenceSubUnit?.trainerMapped ||
                            !isIQA;
                          // Check if it's trainer mapped but not IQA signed off (show blue)
                          const isTrainerMappedOnly =
                            evidenceSubUnit?.trainerMapped === true &&
                            !evidenceSubUnit?.review?.signed_off &&
                            !isIqaChecked;

                          return (
                            <TableCell key={unit.id} className="text-center">
                              {isExpanded && evidenceSubUnit ? (
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() =>
                                    onMappedSubUnitToggle(
                                      evidenceSubUnit.id,
                                      evidence.assignment_id
                                    )
                                  }
                                  disabled={isDisabled}
                                  className={
                                    isTrainerMappedOnly
                                      ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                      : isIqaChecked
                                        ? "data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                                        : ""
                                  }
                                />
                              ) : null}
                            </TableCell>
                          );
                        })}
                      <TableCell className={`text-center ${hasExpandedRows ? "" : "border-l-0"}`} />
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
