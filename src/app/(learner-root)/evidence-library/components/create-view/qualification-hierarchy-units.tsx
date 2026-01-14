/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GapIndicator } from "../gap-indicator";
import { EvidenceIndicator } from "../evidence-indicator";

interface QualificationHierarchyUnitsProps {
  unit: any;
  unitsWatch: any[];
  courseId: number;
  disabled?: boolean;
  canEditLearnerFields?: boolean;
  canEditTrainerFields?: boolean;
  learnerMapHandler: (topic: any, unitId: string | number, subUnitId: string | number) => void;
  trainerMapHandler: (topic: any, unitId: string | number, subUnitId: string | number) => void;
  signedOffHandler: (topic: any, unitId: string | number, subUnitId: string | number) => void;
  commentHandler: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, topicId: string | number, unitId: string | number, subUnitId: string | number) => void;
  getEvidenceCount?: (courseId: number, unitId: string | number, topicId?: string | number) => number;
}

/**
 * QualificationHierarchyUnits Component
 * 
 * Displays hierarchical structure for Qualification courses:
 * Unit → Learning Outcomes (subUnit) → Assessment Criteria (topics)
 * Only topics are mappable (learnerMap/trainerMap/signedOff)
 */
function QualificationHierarchyUnitsComponent({
  unit,
  unitsWatch,
  courseId,
  disabled = false,
  canEditLearnerFields = true,
  canEditTrainerFields = false,
  learnerMapHandler,
  trainerMapHandler,
  signedOffHandler,
  commentHandler,
  getEvidenceCount,
}: QualificationHierarchyUnitsProps) {
  const [expandedSubUnits, setExpandedSubUnits] = useState<Set<string | number>>(new Set());

  const toggleSubUnit = (subUnitId: string | number) => {
    const newExpanded = new Set(expandedSubUnits);
    if (newExpanded.has(subUnitId)) {
      newExpanded.delete(subUnitId);
    } else {
      newExpanded.add(subUnitId);
    }
    setExpandedSubUnits(newExpanded);
  };

  // Get current unit from form state
  const currentUnit = unitsWatch.find(
    (u: any) => String(u.id) === String(unit.id) && u.course_id === courseId
  );

  if (!currentUnit) return null;

  return (
    <Card className="p-4 mb-4">
      {/* Unit Title */}
      <h3 className="font-semibold mb-4 text-lg">{unit.title}</h3>

      {/* Learning Outcomes (subUnits) */}
      {currentUnit.subUnit && currentUnit.subUnit.length > 0 && (
        <div className="ml-2 space-y-3">
          {currentUnit.subUnit.map((subUnit: any) => {
            const subUnitId = subUnit.id;
            const isExpanded = expandedSubUnits.has(subUnitId);
            const hasTopics = subUnit.topics && Array.isArray(subUnit.topics) && subUnit.topics.length > 0;

            // Get topics from current unit state
            const currentSubUnit = currentUnit.subUnit?.find(
              (s: any) => String(s.id) === String(subUnitId)
            );
            const topics = currentSubUnit?.topics || subUnit.topics || [];

            return (
              <Collapsible
                key={subUnitId}
                open={isExpanded}
                onOpenChange={() => toggleSubUnit(subUnitId)}
                className="border rounded-md"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-4 py-2">
                    <h4 className="font-medium">{subUnit.title}</h4>
                    {hasTopics && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                  </Button>
                </CollapsibleTrigger>
                {hasTopics && (
                  <CollapsibleContent className="px-4 pb-4 pt-2">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Learner Map</TableHead>
                            <TableHead>Assessment Criteria</TableHead>
                            <TableHead>Trainer Comment</TableHead>
                            <TableHead className="text-center">Gap</TableHead>
                            <TableHead className="text-center">Signed Off</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topics.map((topic: any) => {
                            const currentTopic = currentSubUnit?.topics?.find(
                              (t: any) => String(t.id) === String(topic.id)
                            );
                            const learnerMap = currentTopic?.learnerMap ?? topic.learnerMap ?? false;
                            const trainerMap = currentTopic?.trainerMap ?? topic.trainerMap ?? false;
                            const signedOff = currentTopic?.signedOff ?? topic.signedOff ?? false;
                            const comment = currentTopic?.comment ?? topic.comment ?? "";

                            return (
                              <TableRow key={topic.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={learnerMap}
                                    onCheckedChange={() => {
                                      learnerMapHandler(topic, unit.id, subUnitId);
                                    }}
                                    disabled={disabled || !canEditLearnerFields}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {topic.code && <strong>{topic.code}: </strong>}
                                    {topic.title}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {!canEditTrainerFields ? (
                                    <span className="text-sm">{comment || "No comment"}</span>
                                  ) : (
                                    <Input
                                      value={comment}
                                      disabled={disabled}
                                      onChange={(e) => {
                                        commentHandler(e, topic.id, unit.id, subUnitId);
                                      }}
                                      className="w-full"
                                    />
                                  )}
                                </TableCell>
                                <TableCell align="center" className="flex flex-col items-center justify-center">
                                  <GapIndicator
                                    learnerMap={learnerMap}
                                    trainerMap={trainerMap}
                                    signedOff={signedOff}
                                    onClick={() => {
                                      if (canEditTrainerFields && !disabled && learnerMap) {
                                        trainerMapHandler(topic, unit.id, subUnitId);
                                      }
                                    }}
                                    disabled={!canEditTrainerFields || disabled || !learnerMap}
                                  />
                                  {getEvidenceCount && (
                                    <EvidenceIndicator
                                      evidenceCount={getEvidenceCount(courseId, unit.id, topic.id)}
                                    />
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox
                                    checked={signedOff}
                                    disabled={
                                      !canEditTrainerFields ||
                                      disabled ||
                                      !learnerMap ||
                                      !trainerMap
                                    }
                                    onCheckedChange={() => {
                                      signedOffHandler(topic, unit.id, subUnitId);
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                )}
                {!hasTopics && (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No assessment criteria
                  </div>
                )}
              </Collapsible>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export const QualificationHierarchyUnits = memo(QualificationHierarchyUnitsComponent);

