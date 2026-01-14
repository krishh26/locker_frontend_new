"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Control, useWatch, UseFormSetValue } from "react-hook-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, ChevronsRight } from "lucide-react";
import type { CourseFormData } from "@/store/api/course/types";
import { cn } from "@/lib/utils";

// Define the interface for a course item
interface CourseItem {
  id: string;
  name: string;
}

interface CourseTransferListProps {
  control: Control<CourseFormData>;
  setValue: UseFormSetValue<CourseFormData>;
  allStandardCourses: CourseItem[]; // All available standard courses
  disabled?: boolean;
  leftTitle?: string;
  rightTitle?: string;
  error?: boolean;
}

function not(a: CourseItem[], b: CourseItem[]): CourseItem[] {
  return a.filter((value) => b.findIndex((item) => item.id === value.id) === -1);
}

function intersection(a: CourseItem[], b: CourseItem[]): CourseItem[] {
  return a.filter((value) => b.findIndex((item) => item.id === value.id) !== -1);
}

function union(a: CourseItem[], b: CourseItem[]): CourseItem[] {
  return [...a, ...not(b, a)];
}

export function CourseTransferList({
  control,
  setValue,
  allStandardCourses,
  disabled = false,
  leftTitle = "Unassigned Standard Courses",
  rightTitle = "Assigned Standard Courses",
  error = false,
}: CourseTransferListProps) {
  const [checked, setChecked] = useState<CourseItem[]>([]);

  // Watch assigned_standards from React Hook Form
  const assignedStandards = useWatch({
    control,
    name: "assigned_standards",
    defaultValue: [],
  });

  // Convert assigned_standards IDs to CourseItem format
  const assignedCourseIds = useMemo(() => {
    return (assignedStandards || []).map((id: string | number | { id?: string | number }) =>
      typeof id === "object" && id !== null ? id.id?.toString() || String(id) : String(id)
    );
  }, [assignedStandards]);

  // Separate available and assigned courses based on assigned_standards
  const { left, right } = useMemo(() => {
    const assigned = allStandardCourses.filter((item) => assignedCourseIds.includes(item.id));
    const available = allStandardCourses.filter((item) => !assignedCourseIds.includes(item.id));
    return { left: available, right: assigned };
  }, [allStandardCourses, assignedCourseIds]);

  const leftChecked = intersection(checked, left);
  const rightChecked = intersection(checked, right);

  const handleToggle = useCallback(
    (value: CourseItem) => {
      if (disabled) return;
      setChecked((prevChecked) => {
        const currentIndex = prevChecked.findIndex((item) => item.id === value.id);
        const newChecked = [...prevChecked];

        if (currentIndex === -1) {
          newChecked.push(value);
        } else {
          newChecked.splice(currentIndex, 1);
        }

        return newChecked;
      });
    },
    [disabled]
  );

  const numberOfChecked = useCallback(
    (items: CourseItem[]) => intersection(checked, items).length,
    [checked]
  );

  const handleToggleAll = useCallback(
    (items: CourseItem[]) => {
      if (disabled) return;
      setChecked((prevChecked) => {
        const numChecked = intersection(prevChecked, items).length;
        if (numChecked === items.length) {
          return not(prevChecked, items);
        } else {
          return union(prevChecked, items);
        }
      });
    },
    [disabled]
  );

  const updateAssignedStandards = (newAssigned: CourseItem[]) => {
    const assignedStandardIds: number[] = newAssigned.map((course) => {
      const idNum = Number(course.id);
      if (isNaN(idNum)) {
        throw new Error(`Invalid course ID: ${course.id}`);
      }
      return idNum;
    });
    setValue("assigned_standards", assignedStandardIds, { shouldValidate: true });
  };

  const handleCheckedRight = () => {
    if (disabled) return;
    const newRight = [...right, ...leftChecked];
    setChecked(not(checked, leftChecked));
    updateAssignedStandards(newRight);
  };

  const handleCheckedLeft = () => {
    if (disabled) return;
    const newRight = not(right, rightChecked);
    setChecked(not(checked, rightChecked));
    updateAssignedStandards(newRight);
  };

  const handleAllRight = () => {
    if (disabled) return;
    const newRight = [...right, ...left];
    updateAssignedStandards(newRight);
  };

  const handleAllLeft = () => {
    if (disabled) return;
    updateAssignedStandards([]);
  };

  const customList = (title: React.ReactNode, items: CourseItem[], side: "left" | "right") => (
    <Card
      className={cn(
        "w-full flex flex-col",
        error && side === "right" && "border-destructive border-2"
      )}
    >
      <CardHeader className="px-4 py-3 shrink-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {numberOfChecked(items)}/{items.length} selected
          </p>
        </div>
        {!disabled && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleAll(items)}
              disabled={items.length === 0}
              className="h-8 text-xs"
              type="button"
            >
              {numberOfChecked(items) === items.length ? "Unselect all" : "Select all"}
            </Button>
          </div>
        )}
      </CardHeader>
      <Separator className="shrink-0" />
      <div className="h-[230px] overflow-y-auto overflow-x-hidden">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-[230px] p-4">
            <p className="text-sm text-muted-foreground italic text-center">
              {side === "left" ? "No available courses" : "No courses assigned"}
            </p>
          </div>
        ) : (
          <div role="list" className="divide-y">
            {items.map((course) => {
              const labelId = `transfer-list-all-item-${course.id}-label`;
              const isChecked = checked.findIndex((item) => item.id === course.id) !== -1;
              return (
                <div
                  key={course.id}
                  role="listitem"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
                    !disabled && "hover:bg-muted",
                    disabled && "cursor-default"
                  )}
                >
                  {!disabled && (
                    <Checkbox
                      checked={isChecked}
                      tabIndex={-1}
                      onCheckedChange={() => handleToggle(course)}
                      aria-labelledby={labelId}
                    />
                  )}
                  <label
                    id={labelId}
                    className="flex-1 text-sm cursor-pointer"
                    onClick={() => {
                      if (!disabled) {
                        handleToggle(course);
                      }
                    }}
                  >
                    {course.name}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-5">{customList(leftTitle, left, "left")}</div>
        <div className="col-span-2 flex flex-col items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCheckedRight}
            disabled={leftChecked.length === 0 || disabled}
            aria-label="move selected right"
            className="min-w-[40px]"
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCheckedLeft}
            disabled={rightChecked.length === 0 || disabled}
            aria-label="move selected left"
            className="min-w-[40px]"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleAllRight}
            disabled={left.length === 0 || disabled}
            aria-label="move all right"
            className="min-w-[40px]"
            type="button"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleAllLeft}
            disabled={right.length === 0 || disabled}
            aria-label="move all left"
            className="min-w-[40px] rotate-180"
            type="button"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="col-span-5">{customList(rightTitle, right, "right")}</div>
      </div>
    </div>
  );
}

