/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { UseFormSetValue } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { GapIndicator } from "../gap-indicator";
import { EvidenceIndicator } from "../evidence-indicator";

export interface QualificationMinimalProps {
  unit: {
    id: string | number;
    code?: string;
    title: string;
  };
  findUnitIndex: (unitId: string | number, courseId: number) => number;
  findSubUnitIndex: (unitIndex: number, subUnitId: string | number) => number;
  findTopicIndex: (
    unitIndex: number,
    subUnitIndex: number,
    topicId: string | number
  ) => number;
  courseId: number;
  setValue: UseFormSetValue<any>;
  unitsWatch: any[];
  learnerMapHandler: (topic: any, unitId: string | number, subUnitId: string | number) => void;
  trainerMapHandler: (topic: any, unitId: string | number, subUnitId: string | number) => void;
  signedOffHandler: (topic: any, unitId: string | number, subUnitId: string | number) => void;
  commentHandler: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, topicId: string | number, unitId: string | number, subUnitId: string | number) => void;
  getEvidenceCount: (courseId: string | number, unitId: string | number, topicId?: string | number) => number;
  canEditLearnerFields: boolean;
  canEditTrainerFields: boolean;
}

export function QualificationMinimal({
  unit,
  findUnitIndex,
  findSubUnitIndex,
  findTopicIndex,
  courseId,
  setValue,
  unitsWatch,
  learnerMapHandler,
  trainerMapHandler,
  signedOffHandler,
  commentHandler,
  getEvidenceCount,
  canEditLearnerFields,
  canEditTrainerFields,
}: QualificationMinimalProps) {

  const unitIndex = findUnitIndex(unit.id, courseId);
  
  // Get current unit from form state
  const currentUnit = React.useMemo(() => {
    return unitsWatch.find(
      (u: any) => String(u.id) === String(unit.id) && u.course_id === courseId
    );
  }, [unitsWatch, unit.id, courseId]);

  // Get current topic values from unitsWatch for real-time updates (same as locker_frontend)
  const getCurrentTopicValues = React.useCallback((topic: any, unitId: string | number, subUnitId: string | number) => {
    const currentUnit = unitsWatch.find((u: any) => String(u.id) === String(unitId));
    if (!currentUnit) {
      return {
        learnerMap: false,
        trainerMap: false,
        signedOff: false,
        comment: '',
      };
    }

    const currentSubUnit = currentUnit?.subUnit?.find(
      (s: any) => String(s.id) === String(subUnitId)
    );
    if (!currentSubUnit) {
      return {
        learnerMap: false,
        trainerMap: false,
        signedOff: false,
        comment: '',
      };
    }

    const currentTopic = currentSubUnit?.topics?.find(
      (t: any) => String(t.id) === String(topic.id)
    );

    return {
      learnerMap: currentTopic?.learnerMap ?? false,
      trainerMap: currentTopic?.trainerMap ?? false,
      signedOff: currentTopic?.signedOff ?? false,
      comment: currentTopic?.comment ?? '',
    };
  }, [unitsWatch]);

  // Get subUnits with their topics grouped
  const subUnitsWithTopics = React.useMemo(() => {
    if (!currentUnit || unitIndex === -1) return [];
    
    const subUnitsData: any[] = [];
    if (currentUnit.subUnit && Array.isArray(currentUnit.subUnit)) {
      currentUnit.subUnit.forEach((subUnit: any) => {
        if (subUnit.topics && Array.isArray(subUnit.topics)) {
          const subUnitIndex = findSubUnitIndex(unitIndex, subUnit.id);
          if (subUnitIndex === -1) return;

          const topics: any[] = [];
          subUnit.topics.forEach((topic: any) => {
            const topicIndex = findTopicIndex(unitIndex, subUnitIndex, topic.id);
            if (topicIndex === -1) return;

            topics.push({
              id: topic.id,
              code: topic.code || "",
              description: topic.title || topic.description || "",
              topic: topic, // Original topic object for handlers
              subUnitId: subUnit.id,
              unitId: unit.id,
            });
          });

          if (topics.length > 0) {
            subUnitsData.push({
              id: subUnit.id,
              title: subUnit.title || subUnit.description || "",
              topics,
              subUnitIndex,
            });
          }
        }
      });
    }
    return subUnitsData;
  }, [currentUnit, unitIndex, findSubUnitIndex, findTopicIndex, unit.id]);

  // Get all topics for select all calculation
  const allTopics = React.useMemo(() => {
    return subUnitsWithTopics.flatMap((subUnit) => subUnit.topics || []);
  }, [subUnitsWithTopics]);

  const allMapped = React.useMemo(() => {
    return allTopics.every((pc) => {
      const values = getCurrentTopicValues(pc.topic, pc.unitId, pc.subUnitId);
      return values.learnerMap;
    });
  }, [allTopics, getCurrentTopicValues]);

  const handleSelectAll = React.useCallback((checked: boolean) => {
    const updated = [...unitsWatch];
    
    allTopics.forEach((pc) => {
      const unit = updated.find((u: any) => String(u.id) === String(pc.unitId));
      if (unit && unit.subUnit) {
        const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(pc.subUnitId));
        if (subUnit && subUnit.topics) {
          const topic = subUnit.topics.find((t: any) => String(t.id) === String(pc.topic.id));
          if (topic) {
            topic.learnerMap = checked;
          }
        }
      }
    });
    
    setValue('units', updated);
  }, [allTopics, unitsWatch, setValue]);

  if (!currentUnit || unitIndex === -1) return null;

  // Calculate evidence count for a topic
  const getTopicEvidenceCount = (topic: any, unitId: string | number) => {
    return getEvidenceCount(courseId, unitId, topic.id);
  };

  return (
    <div className="space-y-4 mb-4">
      {/* Unit Header with Code */}
      <div>
        <h3 className="text-lg font-semibold">
          {unit.code && (
            <span className="text-muted-foreground mr-1">{unit.code} -</span>
          )}
          {unit.title}
        </h3>
      </div>

      {/* Performance Criteria Section */}
      <div className="space-y-4">
        {/* Select All Checkbox */}
        <div className="mb-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allMapped}
              onCheckedChange={(checked) => {
                handleSelectAll(checked === true);
              }}
              disabled={!canEditLearnerFields}
            />
            <Label className="text-sm font-medium">Select All PC&apos;s</Label>
          </div>
        </div>

        {/* SubUnits with Topics */}
        {subUnitsWithTopics.map((subUnit) => (
          <div key={subUnit.id} className="space-y-2">
            {/* SubUnit Header (Learning Outcome) */}
            <div className="font-medium text-base text-foreground mb-2">
              {subUnit.title}
            </div>

            {/* Performance Criteria Table for this SubUnit */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Performance Criteria</TableHead>
                    <TableHead>Trainer Comment</TableHead>
                    <TableHead className="text-center">Gap</TableHead>
                    <TableHead className="text-center">Sign Off</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subUnit.topics?.map((pc: any) => {
                    const currentValues = getCurrentTopicValues(pc.topic, pc.unitId, pc.subUnitId);
                    
                    return (
                      <TableRow key={pc.id}>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={currentValues.learnerMap}
                              onCheckedChange={() => {
                                learnerMapHandler(pc.topic, pc.unitId, pc.subUnitId);
                              }}
                              disabled={!canEditLearnerFields}
                              className="mt-0.5"
                            />
                            <div className="text-sm flex-1">
                              {pc.code && (
                                <span className="font-medium mr-1">{pc.code} -</span>
                              )}
                              {pc.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {!canEditTrainerFields ? (
                            <span className="text-sm text-muted-foreground">
                              {currentValues.comment || 'No comment'}
                            </span>
                          ) : (
                            <Input
                              value={currentValues.comment}
                              onChange={(e) => {
                                commentHandler(e, pc.topic.id, pc.unitId, pc.subUnitId);
                              }}
                              placeholder="Trainer comment"
                              className="w-full"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <GapIndicator
                              learnerMap={currentValues.learnerMap}
                              trainerMap={currentValues.trainerMap}
                              signedOff={currentValues.signedOff}
                              onClick={() => {
                                if (canEditTrainerFields && currentValues.learnerMap) {
                                  trainerMapHandler(pc.topic, pc.unitId, pc.subUnitId);
                                }
                              }}
                              disabled={!canEditTrainerFields || !currentValues.learnerMap}
                            />
                            <EvidenceIndicator evidenceCount={getTopicEvidenceCount(pc.topic, pc.unitId)} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={currentValues.signedOff}
                            disabled={
                              !canEditTrainerFields ||
                              !currentValues.learnerMap ||
                              !currentValues.trainerMap
                            }
                            onCheckedChange={() => {
                              signedOffHandler(pc.topic, pc.unitId, pc.subUnitId);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

