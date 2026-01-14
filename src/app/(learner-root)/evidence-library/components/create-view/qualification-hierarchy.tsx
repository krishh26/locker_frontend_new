/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, memo, useMemo } from "react";
import { Controller, Control, useWatch } from "react-hook-form";
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
import type { EvidenceFormValues, Module, Unit, Task } from "./evidence-form-types";
import { GapIndicator } from "../gap-indicator";
import { EvidenceIndicator } from "../evidence-indicator";

interface QualificationHierarchyProps {
  control: Control<EvidenceFormValues>;
  courseId: number;
  courseName: string;
  modules: Module[];
  disabled?: boolean;
  canEditLearnerFields?: boolean;
  canEditTrainerFields?: boolean;
  getEvidenceCount?: (courseId: number, moduleId: string | number, unitId: string | number, taskId: string | number) => number;
}

/**
 * QualificationHierarchy Component
 * 
 * Displays hierarchical structure for Qualification courses:
 * Course → Module → Unit → Task
 * Only Tasks are mappable (learnerMap/trainerMap/signedOff)
 */
function QualificationHierarchyComponent({
  control,
  courseId,
  courseName,
  modules,
  disabled = false,
  canEditLearnerFields = true,
  canEditTrainerFields = false,
  getEvidenceCount,
}: QualificationHierarchyProps) {
  const unitsWatch = useWatch({ control, name: "units" }) || [];
  
  // Find the qualification course structure in units array
  const qualificationStructure = useMemo(() => {
    return unitsWatch.find(
      (u: any) => u.course_id === courseId && u.modules
    ) as { modules?: Module[]; course_id?: number } | undefined;
  }, [unitsWatch, courseId]);

  const [expandedModules, setExpandedModules] = useState<Set<string | number>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string | number>>(new Set());

  const toggleModule = (moduleId: string | number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleUnit = (unitId: string | number) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  // Get current modules from form state
  const currentModules = qualificationStructure?.modules || modules;

  if (!currentModules || currentModules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No modules available for this qualification course
      </div>
    );
  }

  // Helper to find module/unit/task indices for Controller paths
  const findIndices = (moduleId: string | number, unitId: string | number, taskId: string | number) => {
    const structureIndex = unitsWatch.findIndex((u: any) => u.course_id === courseId && u.modules);
    if (structureIndex === -1) return { structureIndex: -1, moduleIndex: -1, unitIndex: -1, taskIndex: -1 };
    
    const modules = (unitsWatch[structureIndex] as any).modules || [];
    const moduleIndex = modules.findIndex((m: any) => String(m.id) === String(moduleId));
    if (moduleIndex === -1) return { structureIndex, moduleIndex: -1, unitIndex: -1, taskIndex: -1 };
    
    const units = modules[moduleIndex]?.units || [];
    const unitIndex = units.findIndex((u: any) => String(u.id) === String(unitId));
    if (unitIndex === -1) return { structureIndex, moduleIndex, unitIndex: -1, taskIndex: -1 };
    
    const tasks = units[unitIndex]?.tasks || [];
    const taskIndex = tasks.findIndex((t: any) => String(t.id) === String(taskId));
    
    return { structureIndex, moduleIndex, unitIndex, taskIndex };
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 text-lg">{courseName}</h3>
      <div className="space-y-2">
        {currentModules.map((module) => {
          const moduleId = module.id;
          const isModuleExpanded = expandedModules.has(moduleId);
          const units = module.units || [];
          const hasUnits = units.length > 0;

          return (
            <div key={moduleId} className="border rounded-lg">
              {/* Module Header (Expandable) */}
              <Collapsible open={isModuleExpanded} onOpenChange={() => toggleModule(moduleId)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto hover:bg-accent"
                    disabled={!hasUnits}
                  >
                    {hasUnits && (
                      isModuleExpanded ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )
                    )}
                    <span className="font-medium">{module.title}</span>
                    {module.code && <span className="ml-2 text-muted-foreground">({module.code})</span>}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="pl-4 pr-2 pb-2 space-y-2">
                    {units.map((unit) => {
                      const unitId = unit.id;
                      const isUnitExpanded = expandedUnits.has(unitId);
                      const tasks = unit.tasks || [];
                      const hasTasks = tasks.length > 0;

                      return (
                        <div key={unitId} className="border rounded-md">
                          {/* Unit Header (Expandable) */}
                          <Collapsible open={isUnitExpanded} onOpenChange={() => toggleUnit(unitId)}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-start p-2 h-auto hover:bg-accent"
                                disabled={!hasTasks}
                              >
                                {hasTasks && (
                                  isUnitExpanded ? (
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                  )
                                )}
                                <span className="font-medium text-sm">{unit.title}</span>
                                {unit.code && <span className="ml-2 text-muted-foreground text-xs">({unit.code})</span>}
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              {/* Tasks Table (Mappable) */}
                              {hasTasks && (
                                <div className="p-2">
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[80px]">Learner Map</TableHead>
                                          <TableHead>Task</TableHead>
                                          <TableHead>Trainer Comment</TableHead>
                                          <TableHead className="text-center w-[100px]">Gap</TableHead>
                                          <TableHead className="text-center w-[100px]">Signed Off</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {tasks.map((task) => {
                                          const { structureIndex, moduleIndex, unitIndex, taskIndex } = findIndices(
                                            moduleId,
                                            unitId,
                                            task.id
                                          );

                                          if (structureIndex === -1 || moduleIndex === -1 || unitIndex === -1 || taskIndex === -1) {
                                            return null;
                                          }

                                          const basePath = `units.${structureIndex}.modules.${moduleIndex}.units.${unitIndex}.tasks.${taskIndex}`;

                                          return (
                                            <TableRow key={task.id}>
                                              <TableCell>
                                                <Controller
                                                  name={`${basePath}.learnerMap` as any}
                                                  control={control}
                                                  render={({ field }) => (
                                                    <Checkbox
                                                      checked={field.value || false}
                                                      onCheckedChange={field.onChange}
                                                      disabled={disabled || !canEditLearnerFields}
                                                    />
                                                  )}
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <span className="font-medium">
                                                  {task.code && <strong>{task.code}: </strong>}
                                                  {task.title}
                                                </span>
                                              </TableCell>
                                              <TableCell>
                                                <Controller
                                                  name={`${basePath}.comment` as any}
                                                  control={control}
                                                  render={({ field }) => (
                                                    <Input
                                                      {...field}
                                                      placeholder="Trainer comment"
                                                      disabled={disabled || !canEditTrainerFields}
                                                      className="w-full"
                                                    />
                                                  )}
                                                />
                                              </TableCell>
                                              <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                  <Controller
                                                    name={`${basePath}.trainerMap` as any}
                                                    control={control}
                                                    render={({ field }) => (
                                                      <GapIndicator
                                                        learnerMap={
                                                          (unitsWatch[structureIndex] as any)?.modules?.[moduleIndex]?.units?.[unitIndex]?.tasks?.[taskIndex]?.learnerMap || false
                                                        }
                                                        trainerMap={field.value || false}
                                                        signedOff={
                                                          (unitsWatch[structureIndex] as any)?.modules?.[moduleIndex]?.units?.[unitIndex]?.tasks?.[taskIndex]?.signedOff || false
                                                        }
                                                        disabled={disabled || !canEditTrainerFields}
                                                        onClick={() => {
                                                          if (!disabled && canEditTrainerFields) {
                                                            field.onChange(!field.value);
                                                          }
                                                        }}
                                                      />
                                                    )}
                                                  />
                                                  <EvidenceIndicator
                                                    evidenceCount={
                                                      getEvidenceCount
                                                        ? getEvidenceCount(courseId, moduleId, unitId, task.id)
                                                        : 0
                                                    }
                                                  />
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-center">
                                                <Controller
                                                  name={`${basePath}.signedOff` as any}
                                                  control={control}
                                                  render={({ field }) => {
                                                    const learnerMap = (unitsWatch[structureIndex] as any)?.modules?.[moduleIndex]?.units?.[unitIndex]?.tasks?.[taskIndex]?.learnerMap || false;
                                                    const trainerMap = field.value || false;
                                                    return (
                                                      <Checkbox
                                                        checked={field.value || false}
                                                        onCheckedChange={field.onChange}
                                                        disabled={
                                                          disabled ||
                                                          !canEditTrainerFields ||
                                                          !learnerMap ||
                                                          !trainerMap
                                                        }
                                                      />
                                                    );
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
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export const QualificationHierarchy = memo(QualificationHierarchyComponent);

