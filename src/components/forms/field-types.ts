// Field types that only show content and never collect an answer.
export const DISPLAY_ONLY_FIELD_TYPES = ["richtext"] as const;

export const isDisplayOnlyField = (type: string): boolean =>
  (DISPLAY_ONLY_FIELD_TYPES as readonly string[]).includes(type);

// Grid column span for a field inside a `grid-cols-1 md:grid-cols-12` container.
export const fieldWidthClass = (width?: string): string => {
  switch (width) {
    case "half":
      return "col-span-1 md:col-span-6";
    case "third":
      return "col-span-1 md:col-span-4";
    default:
      return "col-span-1 md:col-span-12";
  }
};

// Date preset that is always filled with the day the form is completed and cannot be edited.
export const TODAY_DATE_PRESET = "todayDate";

export const isTodayDateField = (field: { presetField?: string }): boolean =>
  field.presetField === TODAY_DATE_PRESET;
