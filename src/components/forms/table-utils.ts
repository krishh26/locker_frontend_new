import type {
  TableAnswer,
  TableCell,
  TableColumn,
  TableConfig,
  TableRow,
} from "@/store/api/forms/types";

type PresetValues = Record<string, string | number | null | undefined>;

export const newTableId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const createTableColumn = (header: string): TableColumn => ({
  id: newTableId("col"),
  header,
});

export const createTableRow = (
  columns: TableColumn[],
  cell: TableCell = { type: "text" }
): TableRow => ({
  id: newTableId("row"),
  cells: Object.fromEntries(columns.map((c) => [c.id, { ...cell }])),
});

export const createDefaultTable = (columnHeader: (n: number) => string): TableConfig => {
  const columns = [1, 2, 3].map((n) => createTableColumn(columnHeader(n)));
  return {
    showHeader: true,
    columns,
    rows: [createTableRow(columns), createTableRow(columns)],
  };
};

export const getTableCell = (row: TableRow, columnId: string): TableCell =>
  row.cells[columnId] ?? { type: "static", text: "" };

export const parseTableAnswer = (value: unknown): TableAnswer => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as TableAnswer;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

export const setTableAnswerCell = (
  answer: TableAnswer,
  rowId: string,
  columnId: string,
  value: string
): TableAnswer => ({
  ...answer,
  [rowId]: { ...(answer[rowId] ?? {}), [columnId]: value },
});

/**
 * Fills Locker data cells from `presetValues` on top of any saved answer.
 * When `keepSaved` is true (e.g. a locked form) saved preset values win, so the
 * table shows what was true when it was completed.
 */
export const buildTableAnswer = (
  config: TableConfig | undefined,
  saved: TableAnswer,
  presetValues: PresetValues,
  keepSaved = false
): TableAnswer => {
  if (!config) return saved;
  let answer: TableAnswer = { ...saved };
  for (const row of config.rows) {
    for (const column of config.columns) {
      const cell = getTableCell(row, column.id);
      if (cell.type !== "preset" || !cell.presetField) continue;
      const existing = saved[row.id]?.[column.id];
      if (keepSaved && existing) continue;
      const preset = presetValues[cell.presetField];
      if (preset !== undefined && preset !== null && preset !== "") {
        answer = setTableAnswerCell(answer, row.id, column.id, String(preset));
      }
    }
  }
  return answer;
};

/** True when every text/date input cell has a value (checkboxes are optional by nature). */
export const isTableAnswerComplete = (config: TableConfig | undefined, answer: TableAnswer): boolean => {
  if (!config) return true;
  return config.rows.every((row) =>
    config.columns.every((column) => {
      const cell = getTableCell(row, column.id);
      if (cell.type !== "text" && cell.type !== "date") return true;
      return Boolean(answer[row.id]?.[column.id]?.trim());
    })
  );
};