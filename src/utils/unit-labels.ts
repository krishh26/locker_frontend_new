/**
 * Label rules shared by Gap Analysis and the evidence detail view so a unit,
 * learning outcome or Standard module reads the same on both screens.
 *
 * Each helper returns the two columns of the hierarchy: `unitLabel` is the short
 * identifier shown in the narrow left column, `titleLabel` is the descriptive
 * text beside it, and `title` is the flattened form used by exports.
 */

export type UnitLabelParts = {
  unitLabel: string;
  titleLabel: string;
  title: string;
};

type LabelSource = {
  title?: unknown;
  subTitle?: unknown;
  description?: unknown;
  unit_ref?: unknown;
  code?: unknown;
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export function getQualificationUnitParts(
  unit: LabelSource,
  fallback: string,
  index: number,
): UnitLabelParts {
  const titleLabel = text(unit.title) || fallback;
  const ref = text(unit.unit_ref) || text(unit.code);
  const unitLabel = ref || String(index + 1);
  const title =
    ref && titleLabel && ref !== titleLabel
      ? `${ref} - ${titleLabel}`
      : titleLabel || unitLabel || fallback;
  return { unitLabel, titleLabel, title };
}

export function getLearningOutcomeParts(
  sub: LabelSource,
  loOrder: number,
  fallback: string,
): UnitLabelParts {
  const titleLabel = text(sub.title) || text(sub.subTitle) || fallback;
  const code = text(sub.code);
  const unitLabel = code || String(loOrder);
  const title =
    titleLabel && titleLabel !== unitLabel
      ? `${unitLabel}. ${titleLabel}`
      : titleLabel || unitLabel || fallback;
  return { unitLabel, titleLabel, title };
}

type StandardCriteriaSource = {
  id?: unknown;
  code?: unknown;
  type?: unknown;
  subUnit?: unknown[];
};

/**
 * Looks up the code for one Standard criteria row, which is either a sub-unit
 * or a unit that has none.
 */
export type StandardCriteriaCode = (unitId: unknown, rowId: unknown) => string;

/**
 * Codes for every Standard criteria row of a course.
 *
 * Course Builder authors these as "K1"/"B1"/"S1", but some courses leave them
 * blank, so a missing code falls back to the same scheme by position within the
 * type. Pass the form-state units for one course so the create form and the
 * read-only view number identically.
 */
export function buildStandardCriteriaCodes(
  units: StandardCriteriaSource[],
): StandardCriteriaCode {
  const key = (unitId: unknown, rowId: unknown) =>
    `${String(unitId ?? "")}-${String(rowId ?? "")}`;
  const codes = new Map<string, string>();
  const positionByType = new Map<string, number>();

  const nextCode = (type: string) => {
    const position = (positionByType.get(type) ?? 0) + 1;
    positionByType.set(type, position);
    return `${type.charAt(0).toUpperCase()}${position}`;
  };

  for (const unit of units) {
    const type = text(unit.type);
    const subUnits = Array.isArray(unit.subUnit) ? unit.subUnit : [];

    if (subUnits.length > 0) {
      for (const subRaw of subUnits) {
        const sub = subRaw as { id?: unknown; code?: unknown };
        codes.set(key(unit.id, sub.id), text(sub.code) || nextCode(type));
      }
      continue;
    }

    codes.set(key(unit.id, unit.id), text(unit.code) || nextCode(type));
  }

  return (unitId, rowId) => codes.get(key(unitId, rowId)) ?? "";
}

export function getStandardUnitParts(
  unit: LabelSource,
  fallback: string,
  index: number,
): UnitLabelParts {
  const title = text(unit.title);
  const description = text(unit.description);
  const ref = text(unit.unit_ref) || text(unit.code);

  const unitLabel = title || ref || String(index + 1);
  const titleLabel =
    description && description !== title
      ? description
      : title || description || ref || fallback;
  const combined =
    title && description && description !== title
      ? `${title} - ${description}`
      : ref && title && ref !== title
        ? `${ref} - ${title}`
        : title || description || ref || fallback;

  return { unitLabel, titleLabel, title: combined };
}
