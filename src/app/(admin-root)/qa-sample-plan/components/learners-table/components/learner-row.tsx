"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, FileText, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";
import { sanitizeText, getRiskBadgeVariant } from "../../../utils/utils";
import { LearnerUnitsTable } from "./learner-units-table";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { selectUnitSelection } from "@/store/slices/qaSamplePlanSlice";

interface LearnerRowProps {
  learner: SamplePlanLearner;
  learnerIndex: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
}

export const LearnerRow = memo(function LearnerRow({
  learner,
  learnerIndex,
  isExpanded,
  onToggleExpansion,
}: LearnerRowProps) {
  const router = useRouter();
  const unitSelection = useAppSelector(selectUnitSelection);
  const units = Array.isArray(learner.units) ? learner.units : [];
  const learnerKey = `${learner.learner_name ?? ""}-${learnerIndex}`;
  const selectedUnitsArray = unitSelection.selectedUnitsMap[learnerKey] || [];
  const selectedUnitsSet = new Set(selectedUnitsArray);

  const handleViewDocuments = (learner: SamplePlanLearner) => {
    const learnerId = learner.learner_id || learner.learnerId || learner.id;
    if (learnerId) {
      router.push(`/evidence-library?learner_id=${learnerId}`);
    } else {
      toast.warning("Unable to open documents. Learner ID not found.");
    }
  };

  const handleViewPortfolio = (learner: SamplePlanLearner) => {
    const learnerId = learner.learner_id || learner.learnerId || learner.id;
    if (learnerId) {
      router.push(`/portfolio?learner_id=${learnerId}`);
    } else {
      toast.warning("Unable to open portfolio. Learner ID not found.");
    }
  };

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggleExpansion}>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={onToggleExpansion}>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium min-w-[160px]">
          {sanitizeText(learner.assessor_name)}
        </TableCell>
        <TableCell>
          <Badge variant={getRiskBadgeVariant(learner.risk_level)}>
            {sanitizeText(learner.risk_level)}
          </Badge>
        </TableCell>
        <TableCell>
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={Boolean(learner.qa_approved)} onCheckedChange={() => {}} />
          </div>
        </TableCell>
        <TableCell className="min-w-[180px]">
          {sanitizeText(learner.learner_name)}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDocuments(learner)}
              title="View Documents / Evidence"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewPortfolio(learner)}
              title="View Portfolio"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} className="p-0">
          <Collapsible
            open={isExpanded}
            onOpenChange={(open) => {
              if (open !== isExpanded) {
                onToggleExpansion();
              }
            }}
          >
            <CollapsibleContent>
              <div className="p-4 bg-muted/30 border-t">
                <LearnerUnitsTable
                  learner={learner}
                  learnerIndex={learnerIndex}
                  units={units}
                  selectedUnitsSet={selectedUnitsSet}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>
    </>
  );
});
