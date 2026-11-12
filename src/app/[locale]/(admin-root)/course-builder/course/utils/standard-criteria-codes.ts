export type CriteriaType = "Behaviour" | "Knowledge" | "Skills";

export type CriteriaRow = { type?: string; code?: string };

export const TYPE_PREFIX: Record<CriteriaType, string> = {
  Knowledge: "K",
  Skills: "S",
  Behaviour: "B",
};

const prefixFor = (type?: string): string =>
  TYPE_PREFIX[(type as CriteriaType) in TYPE_PREFIX ? (type as CriteriaType) : "Behaviour"];

/** Codes this feature generates (K1, S12, B3); anything else was typed by hand and is left alone. */
export const AUTO_CODE_PATTERN = /^[KSB]\d+$/i;

/** Highest existing number for the type's prefix + 1, so deleting a row never produces a duplicate. */
export const nextCriteriaCode = (
  rows: CriteriaRow[] | undefined,
  type: CriteriaType,
  excludeIndex?: number
): string => {
  const prefix = TYPE_PREFIX[type];
  const pattern = new RegExp(`^${prefix}(\\d+)$`, "i");
  const highest = (rows ?? []).reduce((max, row, i) => {
    if (i === excludeIndex) return max;
    const match = row?.code?.trim().match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${highest + 1}`;
};

/**
 * Codes for older courses: a plain number keeps its number and gains the type prefix (3 -> K3);
 * an empty code gets the next free number for its type in the unit.
 */
export const generateMissingCriteriaCodes = (
  rows: CriteriaRow[] | undefined
): Array<{ index: number; code: string }> => {
  const list = rows ?? [];
  const highest: Record<string, number> = { K: 0, S: 0, B: 0 };
  const updates: Array<{ index: number; code: string }> = [];

  list.forEach((row, index) => {
    const code = row?.code?.trim() ?? "";
    const prefixed = code.match(/^([KSB])(\d+)$/i);
    if (prefixed) {
      const prefix = prefixed[1].toUpperCase();
      highest[prefix] = Math.max(highest[prefix], Number(prefixed[2]));
    } else if (/^\d+$/.test(code)) {
      const prefix = prefixFor(row?.type);
      const number = Number(code);
      highest[prefix] = Math.max(highest[prefix], number);
      updates.push({ index, code: `${prefix}${number}` });
    }
  });

  list.forEach((row, index) => {
    if (row?.code?.trim()) return;
    const prefix = prefixFor(row?.type);
    highest[prefix] += 1;
    updates.push({ index, code: `${prefix}${highest[prefix]}` });
  });

  return updates;
};
