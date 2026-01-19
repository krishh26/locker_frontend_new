"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CourseUnit, SubUnit } from "@/store/api/skills-scan/types";

interface LearnerData {
  units: CourseUnit[];
  course_core_type?: string;
}

interface ChartData {
  date: string;
  [key: string]: string | number;
}

interface SkillsScanProgressChartProps {
  learnerData: LearnerData;
  selectedTopic: string;
}

const transformProgressDataByTopic = (
  json: LearnerData,
  selectedTopic: string
): ChartData[] => {
  const dateMap: Record<string, ChartData> = {};
  const isStandardType = json.course_core_type === "Standard";

  json.units.forEach((unit) => {
    if (unit.title === selectedTopic) {
      // For Standard courses: if unit type is NOT "Duty", use unit's quarter_review directly
      if (isStandardType && unit.type !== "Duty") {
        const label = unit.title;
        const reviewPhases = unit.quarter_review || {};

        Object.entries(reviewPhases).forEach(([phase, rating]) => {
          if (!dateMap[phase]) {
            dateMap[phase] = { date: phase };
          }
          dateMap[phase][label] = rating;
        });
      } else {
        // For Qualification courses or Duty units in Standard courses, use subUnits
        unit.subUnit?.forEach((sub: SubUnit) => {
          const label = sub.title;
          const reviewPhases = sub.quarter_review || {};

          Object.entries(reviewPhases).forEach(([phase, rating]) => {
            if (!dateMap[phase]) {
              dateMap[phase] = { date: phase };
            }
            dateMap[phase][label] = rating;
          });
        });
      }
    }
  });

  const reviewOrder = ["induction", "first", "second", "third"];
  console.log("🚀 ~ transformProgressDataByTopic ~ dateMap:", dateMap)
  return Object.values(dateMap).sort(
    (a, b) =>
      reviewOrder.indexOf(a.date.toString()) -
      reviewOrder.indexOf(b.date.toString())
  );
};

export function SkillsScanProgressChart({
  learnerData,
  selectedTopic,
}: SkillsScanProgressChartProps) {
  const graphData = useMemo(() => {
    if (!selectedTopic) return [];
    return transformProgressDataByTopic(learnerData, selectedTopic);
  }, [learnerData, selectedTopic]);

  const lines = useMemo(() => {
    if (graphData.length === 0) return [];
    return Object.keys(graphData[0]).filter((key) => key !== "date");
  }, [graphData]);

  if (graphData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">No data available for this topic.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={graphData}>
        <XAxis
          dataKey="date"
          tickFormatter={(value) => {
            const labelMap: Record<string, string> = {
              induction: "Induction",
              first: "First Review",
              second: "Second Review",
              third: "Third Review",
            };
            return labelMap[value] || value;
          }}
        />
        <YAxis
          domain={[1, 4]}
          ticks={[1, 2, 3, 4]}
          tickFormatter={(value) => {
            const emojiMap: Record<number, string> = {
              1: "☹️",
              2: "😖",
              3: "🙂",
              4: "😁",
            };
            return emojiMap[value as number] || value.toString();
          }}
        />
        <Tooltip />
        {lines.length > 0 && <Legend />}
        {lines.map((lineKey, idx) => (
          <Line
            key={idx}
            type="monotone"
            dataKey={lineKey}
            stroke={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

