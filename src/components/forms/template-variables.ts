"use client";

import { useCallback } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { TODAY_DATE_PRESET } from "./field-types";

type PresetValues = Record<string, string | number | null | undefined>;

export type TemplateVariable = { key: string; presetField: string };

/** Variables usable as `{key}` in statements and text blocks, resolved from preset values. */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: "learner_name", presetField: "learnerFullName" },
  { key: "learner_uln", presetField: "uln" },
  { key: "trainer_name", presetField: "TrainerFullName" },
  { key: "iqa_name", presetField: "courseIQA" },
  { key: "line_manager_name", presetField: "LineManagerFullName" },
  { key: "employer_name", presetField: "courseEmployer" },
  { key: "course_name", presetField: "courseName" },
  { key: "today_date", presetField: TODAY_DATE_PRESET },
];

const VARIABLE_BY_KEY = new Map(TEMPLATE_VARIABLES.map((v) => [v.key, v]));

export const variableToken = (key: string): string => `{${key}}`;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const variableValue = (variable: TemplateVariable, values: PresetValues): string | undefined => {
  const value = values[variable.presetField];
  if (value !== undefined && value !== null && value !== "") return String(value);
  if (variable.presetField === TODAY_DATE_PRESET) return format(new Date(), "dd/MM/yyyy");
  return undefined;
};

/**
 * Replaces known `{key}` tokens with their values. Tokens without a value become `[Label]`.
 * In html mode the inserted text is escaped so it can't inject markup.
 */
export const resolveTemplate = (
  text: string,
  values: PresetValues,
  placeholder: (key: string) => string,
  html = false
): string =>
  text.replace(/\{([a-z_]+)\}/g, (match, key: string) => {
    const variable = VARIABLE_BY_KEY.get(key);
    if (!variable) return match;
    const resolved = variableValue(variable, values) ?? `[${placeholder(key)}]`;
    return html ? escapeHtml(resolved) : resolved;
  });

export function useVariableLabel() {
  const t = useTranslations("forms.variables.labels");
  return useCallback((key: string) => t(key as "learner_name"), [t]);
}

export function useTemplateResolver() {
  const variableLabel = useVariableLabel();
  return useCallback(
    (text: string, values: PresetValues = {}, html = false) =>
      resolveTemplate(text, values, variableLabel, html),
    [variableLabel]
  );
}
