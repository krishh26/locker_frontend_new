"use client";

import { memo, Fragment } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/store/hooks";
import { selectFilterState } from "@/store/slices/qaSamplePlanSlice";
import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";
import { LearnerRow } from "./learner-row";

interface LearnersTableContentProps {
  expandedRows: Set<number>;
  onToggleRowExpansion: (index: number) => void;
  visibleRows: SamplePlanLearner[];
  isLearnersInFlight: boolean;
  isLearnersError: boolean;
}

export const LearnersTableContent = memo(function LearnersTableContent({
  expandedRows,
  onToggleRowExpansion,
  visibleRows,
  isLearnersInFlight,
  isLearnersError,
}: LearnersTableContentProps) {
  const t = useTranslations("qaSamplePlan.learnersTable");
  const filterState = useAppSelector(selectFilterState);
  const filterApplied = filterState.filterApplied;
  const filterError = filterState.filterError;
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>{t("columns.assessor")}</TableHead>
            <TableHead>{t("columns.riskLevel")}</TableHead>
            <TableHead>{t("columns.qaApproved")}</TableHead>
            <TableHead>{t("columns.learner")}</TableHead>
            <TableHead>{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!filterApplied ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <p className="text-muted-foreground">
                  {t("empty.selectCoursePlanThenFilter")}
                </p>
              </TableCell>
            </TableRow>
          ) : isLearnersInFlight ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">{t("loading")}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : isLearnersError ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <p className="text-destructive">
                  {filterError || t("errors.fetchLearners")}
                </p>
              </TableCell>
            </TableRow>
          ) : visibleRows.length ? (
            visibleRows.map((row, index) => {
              const isExpanded = expandedRows.has(index);
              return (
                <Fragment key={`${row.learner_id || row.learnerId || row.id || index}`}>
                  <LearnerRow
                    learner={row}
                    learnerIndex={index}
                    isExpanded={isExpanded}
                    onToggleExpansion={() => onToggleRowExpansion(index)}
                  />
                </Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <p className="text-muted-foreground">{t("empty.noLearnersMatch")}</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
});
