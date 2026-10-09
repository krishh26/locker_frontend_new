"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PRESET_FIELDS, type PresetField } from "@/app/[locale]/(admin-root)/forms/[formId]/builder/utils/preset-data";

export type PresetOptionGroup = { group: string; options: { presetField: string; type: string }[] };

/** Presets that map to a Locker value, grouped by role, for use as table cell sources. */
export const PRESET_OPTION_GROUPS: PresetOptionGroup[] = Object.entries(PRESET_FIELDS).map(
  ([group, presets]: [string, PresetField[]]) => ({
    group,
    options: presets
      .filter((p) => p.field.presetField)
      .map((p) => ({ presetField: p.field.presetField as string, type: p.type })),
  })
);

export function usePresetLabel() {
  const t = useTranslations("forms.builder.presets.fields");
  const typeByPreset = useMemo(() => {
    const map = new Map<string, string>();
    PRESET_OPTION_GROUPS.forEach((g) => g.options.forEach((o) => map.set(o.presetField, o.type)));
    return map;
  }, []);

  return useCallback(
    (presetField: string) => {
      const type = typeByPreset.get(presetField);
      return type ? t(type as "learner-name") : presetField;
    },
    [t, typeByPreset]
  );
}
