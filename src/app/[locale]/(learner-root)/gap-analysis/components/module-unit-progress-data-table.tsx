"use client";

import { useState, useEffect, useMemo } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId, setCurrentCourseId } from "@/store/slices/courseSlice";

import type { LearnerCourse } from "@/store/api/learner/types";

/* ---------------- TYPES ---------------- */

type SubUnitRow = {
  id: string | number;
  subTitle: string;
  learnerMap: boolean;
  trainerMap: boolean;
  gap: "complete" | "partial" | "none";
  comment: string;
};

type CourseWithUnits = {
  course_id: number;
  course_name: string;
  course_core_type?: string | null;
  units?: any[];
};

type QualificationUnit = {
  id: string | number;
  title: string;
  subUnit?: any[];
};

/* ---------------- HELPERS ---------------- */

function resolveCourseFromLearnerEntry(
  learnerCourse: LearnerCourse | undefined | null,
): CourseWithUnits | null {
  if (!learnerCourse) return null;

  const inner = learnerCourse.course;
  if (!inner?.course_id) return null;

  const wrapperUnits = (learnerCourse as any).units;
  const innerUnits = (inner as any).units;

  return {
    ...(inner as CourseWithUnits),
    units:
      Array.isArray(innerUnits) && innerUnits.length > 0
        ? innerUnits
        : wrapperUnits || [],
  };
}

function collectStandardGapRows(units: any[], selectedType: string) {
  const rows: any[] = [];

  for (const unit of units) {
    if (Array.isArray(unit.subUnit)) {
      for (const sub of unit.subUnit) {
        if (String(sub.type) !== selectedType) continue;

        rows.push({
          id: `${unit.id}-${sub.id}`,
          title: sub.title || sub.subTitle || "",
          code: sub.code || "",
          learnerMapDirect: sub.learnerMap,
          trainerMapDirect: sub.trainerMap,
          evidenceBoxes: sub.evidenceBoxes,
        });
      }
      continue;
    }

    if (Array.isArray(unit.items)) {
      for (const item of unit.items) {
        if (item.type !== selectedType) continue;

        rows.push({
          id: item.id,
          title: item.title,
          code: item.code,
          evidenceBoxes: item.evidenceBoxes,
        });
      }
      continue;
    }

    if (unit.type === selectedType) {
      rows.push({
        id: unit.id,
        title: unit.title,
        code: unit.code,
        evidenceBoxes: unit.evidenceBoxes,
        learnerMapDirect: unit.learnerMap,
        trainerMapDirect: unit.trainerMap,
      });
    }
  }

  return rows;
}

function mapsFromRow(row: any) {
  const learnerMap =
    row.learnerMapDirect ||
    row.evidenceBoxes?.some((b: any) => b.learnerMap);

  const trainerMap =
    row.trainerMapDirect ||
    row.evidenceBoxes?.some((b: any) => b.trainerMap);

  return {
    learnerMap: !!learnerMap,
    trainerMap: !!trainerMap,
  };
}

/* ---------------- COMPONENT ---------------- */

export function ModuleUnitProgressDataTable() {
  const dispatch = useAppDispatch();

  const courses = useAppSelector((state) => state.auth.courses);
  const currentCourseId = useAppSelector(selectCurrentCourseId);

  const [selectedCourse, setSelectedCourse] = useState<CourseWithUnits | null>(() =>
    currentCourseId
      ? resolveCourseFromLearnerEntry(
          courses.find((c) => c.course?.course_id === currentCourseId),
        )
      : null,
  );

  const [selectedType, setSelectedType] = useState<
    "Knowledge" | "Behaviour" | "Skills"
  >("Knowledge");

  const [selectedUnit, setSelectedUnit] =
    useState<QualificationUnit | null>(null);

  const isStandardCourse = selectedCourse?.course_core_type === "Standard";

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {
    if (!currentCourseId) return;

    const match = courses.find((c) => c.course?.course_id === currentCourseId);
    if (match) {
      setSelectedCourse(resolveCourseFromLearnerEntry(match));
    }
  }, [courses, currentCourseId]);

  useEffect(() => {
    if (!selectedCourse || isStandardCourse) return;

    if (selectedCourse.units?.length) {
      setSelectedUnit(selectedCourse.units[0]);
    }
  }, [selectedCourse, isStandardCourse]);

  /* ---------------- STANDARD ---------------- */

  const standardGapRows = useMemo(() => {
    if (!isStandardCourse || !selectedCourse?.units) return [];
    return collectStandardGapRows(selectedCourse.units, selectedType);
  }, [selectedCourse, selectedType, isStandardCourse]);

  /* ---------------- QUALIFICATION ---------------- */

  const qualificationRows: SubUnitRow[] = useMemo(() => {
    if (isStandardCourse || !selectedUnit?.subUnit) return [];

    const rows: SubUnitRow[] = [];

    for (const sub of selectedUnit.subUnit) {
      if (!sub.topics) continue;

      for (const topic of sub.topics) {
        let gap: "complete" | "partial" | "none" = "none";

        if (topic.learnerMap && topic.trainerMap) gap = "complete";
        else if (topic.learnerMap || topic.trainerMap) gap = "partial";

        rows.push({
          id: topic.id,
          subTitle: topic.title,
          learnerMap: topic.learnerMap,
          trainerMap: topic.trainerMap,
          gap,
          comment: topic.comment || "",
        });
      }
    }

    return rows;
  }, [selectedUnit, isStandardCourse]);

  /* ---------------- FINAL TABLE DATA ---------------- */

  const tableData: SubUnitRow[] = useMemo(() => {
    if (isStandardCourse) {
      return standardGapRows.map((item) => {
        const { learnerMap, trainerMap } = mapsFromRow(item);

        let gap: "complete" | "partial" | "none" = "none";
        if (learnerMap && trainerMap) gap = "complete";
        else if (learnerMap || trainerMap) gap = "partial";

        return {
          id: item.id,
          subTitle: item.title,
          learnerMap,
          trainerMap,
          gap,
          comment: item.code || "",
        };
      });
    }

    return qualificationRows;
  }, [isStandardCourse, standardGapRows, qualificationRows]);

  /* ---------------- TABLE ---------------- */

  const columns: ColumnDef<SubUnitRow>[] = [
    { accessorKey: "subTitle", header: "Title" },
    { accessorKey: "learnerMap", header: "Learner" },
    { accessorKey: "trainerMap", header: "Trainer" },
    { accessorKey: "gap", header: "Gap" },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* ---------------- UI ---------------- */

  return (
    <div>
      {/* Course Select */}
      <select
        value={selectedCourse?.course_id || ""}
        onChange={(e) => {
          const entry = courses.find(
            (c) => c.course?.course_id.toString() === e.target.value,
          );

          const next = entry ? resolveCourseFromLearnerEntry(entry) : null;

          setSelectedCourse(next);
          dispatch(setCurrentCourseId(next?.course_id || null));
        }}
      >
        {courses.map((c) => (
          <option key={c.course.course_id} value={c.course.course_id}>
            {c.course.course_name}
          </option>
        ))}
      </select>

      {/* Type Select (Standard only) */}
      {isStandardCourse && (
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
        >
          <option value="Knowledge">Knowledge</option>
          <option value="Behaviour">Behaviour</option>
          <option value="Skills">Skills</option>
        </select>
      )}

      {/* Unit Select (Qualification only) */}
      {!isStandardCourse && (
        <select
          value={selectedUnit?.id || ""}
          onChange={(e) => {
            const unit = selectedCourse?.units?.find(
              (u: any) => u.id.toString() === e.target.value
            );
            setSelectedUnit(unit || null);
          }}
        >
          {selectedCourse?.units?.map((u: any) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
      )}

      {/* Table */}
      <table>
        <thead>
          {table.getHeaderGroups().map((h) => (
            <tr key={h.id}>
              {h.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

