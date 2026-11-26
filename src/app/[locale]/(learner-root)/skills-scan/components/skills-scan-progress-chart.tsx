"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  type TooltipProps,
} from "recharts";
import type { CourseUnit, SubUnit } from "@/store/api/skills-scan/types";
import { ratesUnitDirectly } from "../utils/rating-target";

interface LearnerData {
  units: CourseUnit[];
  course_core_type?: string;
}

interface ChartData {
  date: string;
  [key: string]: string | number;
}

/** One line on the chart: a KSB criterion / sub-unit, or the unit itself. */
export interface ChartSeries {
  key: string;
  /** Short label shown on the chart legend, e.g. "K1" */
  label: string;
  /** Full title, shown in the tooltip and the side legend */
  title: string;
  color: string;
}

interface SkillsScanProgressChartProps {
  learnerData: LearnerData;
  selectedTopic: string;
}

const REVIEW_ORDER = ["induction", "first", "second", "third"] as const;

export const RATING_EMOJI: Record<number, string> = {
  1: "😖",
  2: "☹️",
  3: "🙂",
  4: "😁",
};

const MAX_SHORT_LABEL = 24;

export const getSeriesColor = (index: number) =>
  `hsl(${(index * 47) % 360}, 70%, 45%)`;

const shorten = (text: string) =>
  text.length > MAX_SHORT_LABEL ? `${text.slice(0, MAX_SHORT_LABEL - 1)}…` : text;

/** The chart lines for a unit; shared with the side legend so colours match. */
export function getUnitChartSeries(
  unit: CourseUnit | undefined,
  isStandardType: boolean
): ChartSeries[] {
  if (!unit) return [];

  if (ratesUnitDirectly(unit, isStandardType)) {
    return [
      {
        key: `unit-${unit.id}`,
        label: shorten(unit.code || unit.title),
        title: unit.title,
        color: getSeriesColor(0),
      },
    ];
  }

  return (unit.subUnit ?? []).map((sub: SubUnit, index) => ({
    key: `sub-${sub.id ?? index}`,
    label: sub.code?.trim() || shorten(sub.title),
    title: sub.title,
    color: getSeriesColor(index),
  }));
}

const getReviews = (
  unit: CourseUnit,
  isStandardType: boolean
): Array<{ key: string; review?: SubUnit["quarter_review"] }> =>
  ratesUnitDirectly(unit, isStandardType)
    ? [{ key: `unit-${unit.id}`, review: unit.quarter_review }]
    : (unit.subUnit ?? []).map((sub, index) => ({
        key: `sub-${sub.id ?? index}`,
        review: sub.quarter_review,
      }));

const buildChartData = (unit: CourseUnit, isStandardType: boolean): ChartData[] => {
  const dateMap: Record<string, ChartData> = {};

  getReviews(unit, isStandardType).forEach(({ key, review }) => {
    Object.entries(review ?? {}).forEach(([phase, rating]) => {
      if (!rating) return;
      dateMap[phase] ??= { date: phase };
      dateMap[phase][key] = rating;
    });
  });

  return Object.values(dateMap).sort(
    (a, b) =>
      REVIEW_ORDER.indexOf(a.date as (typeof REVIEW_ORDER)[number]) -
      REVIEW_ORDER.indexOf(b.date as (typeof REVIEW_ORDER)[number])
  );
};

export function SkillsScanProgressChart({
  learnerData,
  selectedTopic,
}: SkillsScanProgressChartProps) {
  const t = useTranslations("skillsScan");
  const isStandardType = learnerData.course_core_type === "Standard";

  const unit = useMemo(
    () => learnerData.units.find((u) => u.title === selectedTopic),
    [learnerData.units, selectedTopic]
  );

  const series = useMemo(
    () => getUnitChartSeries(unit, isStandardType),
    [unit, isStandardType]
  );

  const graphData = useMemo(
    () => (unit ? buildChartData(unit, isStandardType) : []),
    [unit, isStandardType]
  );

  // Only draw lines that have at least one rating.
  const ratedSeries = useMemo(
    () => series.filter((s) => graphData.some((row) => row[s.key] !== undefined)),
    [series, graphData]
  );

  const phaseLabel = (value: string) => {
    switch (value) {
      case "induction":
        return t("progressChart.phases.induction");
      case "first":
        return t("progressChart.phases.first");
      case "second":
        return t("progressChart.phases.second");
      case "third":
        return t("progressChart.phases.third");
      default:
        return value;
    }
  };

  const ratingLabel = (value: number) => {
    switch (value) {
      case 1:
        return t("options.rating.never");
      case 2:
        return t("options.rating.notSure");
      case 3:
        return t("options.rating.sometimes");
      case 4:
        return t("options.rating.always");
      default:
        return String(value);
    }
  };

  if (graphData.length === 0 || ratedSeries.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">{t("progressChart.noDataForTopic")}</p>
      </div>
    );
  }

  const seriesByKey = new Map(series.map((s) => [s.key, s]));

  const renderTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="max-w-xs rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          {phaseLabel(String(label))}
        </p>
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {payload.map((entry) => {
            const s = seriesByKey.get(String(entry.dataKey));
            if (!s) return null;
            const rating = Number(entry.value);
            return (
              <li key={s.key} className="flex items-start gap-2 text-xs">
                <span
                  className="mt-1 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <div className="min-w-0">
                  <p className="font-semibold" style={{ color: s.color }}>
                    {s.label}{" "}
                    <span className="font-normal text-foreground">
                      {RATING_EMOJI[rating]} {ratingLabel(rating)}
                    </span>
                  </p>
                  {s.label !== s.title && (
                    <p className="line-clamp-2 text-muted-foreground">{s.title}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={graphData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={phaseLabel} />
        <YAxis
          domain={[1, 4]}
          ticks={[1, 2, 3, 4]}
          width={40}
          tickFormatter={(value) => RATING_EMOJI[value as number] || String(value)}
        />
        <Tooltip content={renderTooltip} wrapperStyle={{ zIndex: 10 }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => seriesByKey.get(String(value))?.label ?? value}
        />
        {ratedSeries.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
