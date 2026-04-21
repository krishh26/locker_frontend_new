"use client";

import { FileText, Pencil, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
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

function normalizeRole(role: unknown): string {
  return String(role ?? "").trim().toUpperCase();
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
  const t = useTranslations("qaSamplePlan.evidence.evidenceTable");
  const isIqaUser = normalizeRole(currentUserRole) === "IQA";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("title", { count: evidenceList.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t("columns.refNo")}</TableHead>
                <TableHead>{t("columns.evidenceDocuments")}</TableHead>
                <TableHead>{t("columns.evidenceName")}</TableHead>
                <TableHead>{t("columns.evidenceDescription")}</TableHead>
                <TableHead>{t("columns.assessmentMethod")}</TableHead>
                <TableHead>{t("columns.dateUploaded")}</TableHead>
                <TableHead className="text-center">{t("columns.signOffAllCriteria")}</TableHead>
                {hasExpandedRows &&
                  allUnitsToDisplay.map((unit) => (
                    <TableHead
                      key={`hdr-${String(unit.unit_code)}-${String(unit.id)}`}
                      className="text-center min-w-[100px]"
                    >
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{unit.code}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="max-w-[320px]">
                          {unit.title || t("na")}
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                <TableHead
                  className={`text-center cursor-pointer ${hasExpandedRows ? "" : "border-l-0"}`}
                  onClick={onToggleAllRows}
                >
                  {hasExpandedRows ? t("showLess") : t("showAll")}
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
                    {t("empty")}
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
                        <div className="flex items-center gap-1">
                          <span>{refNo}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
                            <Link
                              href={`/evidence-library/${evidence.assignment_id}`}
                              title={t("openInEvidenceLibrary")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {onOpenCommentModal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onOpenCommentModal(evidence)}
                              className="h-7 w-7 shrink-0"
                              title={t("addComment")}
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
                            {evidence.file.name || t("na")}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            {evidence.file?.name || t("na")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {evidence.title || t("na")}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {evidence.description || t("na")}
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
                            <span className="text-muted-foreground">{t("na")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {evidence.created_at
                          ? format(new Date(evidence.created_at), "dd MMM yyyy")
                          : t("na")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={(() => {
                            if (criteriaSignOff[refNo]) return true;
                            if (!evidence?.mappedSubUnits) return false;
                            return evidence.mappedSubUnits.every(
                              (sub) => sub.review?.signed_off === true
                            );
                          })()}
                          onCheckedChange={() => onCriteriaToggle(refNo)}
                          disabled={
                            !isIqaUser ||
                            !evidence?.mappedSubUnits
                            //  ||
                            // (() => {
                            //   const trainerMappedSubUnits = evidence.mappedSubUnits.filter(
                            //     (sub) => sub.trainerMapped === true
                            //   );
                            //   return (
                            //     trainerMappedSubUnits.length === 0 ||
                            //     trainerMappedSubUnits.every(
                            //       (sub) => sub.review?.signed_off === true
                            //     )
                            //   );
                            // })()
                          }
                        />
                      </TableCell>
                      {hasExpandedRows &&
                        allUnitsToDisplay.map((unit) => {
                          const evidenceSubUnit = isExpanded
                            ? mappedSubUnits.find((su) => String(su.id) === String(unit.id))
                            : null;

                          const isUnitNotInEvidence = !evidenceSubUnit;
                          const stateKey = createStateKey(
                            evidence?.assignment_id,
                            evidenceSubUnit?.id ?? unit.id
                          );

                          const isChecked = evidenceSubUnit
                            ? evidenceSubUnit.review?.signed_off === true ||
                              mappedSubUnitsChecked[stateKey] === true
                            : false;

                          const isLocked = lockedCheckboxes.has(stateKey);
                          const isIqaChecked = iqaCheckedCheckboxes.has(stateKey);
                          const isIQA = isIqaUser;
                          const isTrainerMappedOnly =
                            evidenceSubUnit?.trainerMapped === true &&
                            !evidenceSubUnit?.review?.signed_off &&
                            !isIqaChecked;
                          const checkboxStateClass = isChecked
                            ? "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            : isTrainerMappedOnly
                              ? "data-[state=unchecked]:bg-orange-400 data-[state=unchecked]:border-emerald-600"
                              : "";

                          const isDisabled =
                            isUnitNotInEvidence ||
                            (!isIQA && isLocked) ||
                           
                            !isIQA;

                          const columnKey = `cell-${String(unit.unit_code)}-${String(unit.id)}-${evidence.assignment_id}`;

                          if (!isExpanded) {
                            return <TableCell key={columnKey} className="text-center" />;
                          }

                          if (!evidenceSubUnit) {
                            return (
                              <TableCell key={columnKey} className="text-center">
                                {/* <Checkbox checked={false} disabled className="opacity-50" /> */}
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={columnKey} className="text-center">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() =>
                                  onMappedSubUnitToggle(evidenceSubUnit.id, evidence.assignment_id)
                                }
                                disabled={isDisabled}
                                className={checkboxStateClass}
                              />
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
