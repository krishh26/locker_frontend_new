"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { TableAnswer, TableConfig } from "@/store/api/forms/types";
import { getTableCell, setTableAnswerCell } from "./table-utils";

interface TableFieldProps {
  config?: TableConfig;
  value: TableAnswer;
  onChange?: (value: TableAnswer) => void;
  disabled?: boolean;
  error?: boolean;
  /** Label shown in place of a Locker data cell that has no value yet (builder / preview). */
  presetPlaceholder?: (presetField: string) => string;
  idPrefix?: string;
}

export function TableField({
  config,
  value,
  onChange,
  disabled = false,
  error = false,
  presetPlaceholder,
  idPrefix = "table",
}: TableFieldProps) {
  if (!config || config.columns.length === 0) return null;

  const readOnly = disabled || !onChange;

  const update = (rowId: string, columnId: string, cellValue: string) => {
    onChange?.(setTableAnswerCell(value, rowId, columnId, cellValue));
  };

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-md border",
        error && "border-destructive"
      )}
    >
      <table className="w-full border-collapse text-sm">
        {config.showHeader && (
          <thead>
            <tr className="bg-muted/50">
              {config.columns.map((column) => (
                <th
                  key={column.id}
                  className="border-b border-r px-3 py-2 text-left font-medium last:border-r-0"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {config.rows.map((row) => (
            <tr key={row.id} className="border-b last:border-b-0">
              {config.columns.map((column) => {
                const cell = getTableCell(row, column.id);
                const cellValue = value[row.id]?.[column.id] ?? "";
                const cellId = `${idPrefix}-${row.id}-${column.id}`;

                return (
                  <td
                    key={column.id}
                    className="min-w-32 border-r px-2 py-1.5 align-middle last:border-r-0"
                  >
                    {cell.type === "static" && (
                      <span className="font-medium whitespace-pre-wrap">{cell.text}</span>
                    )}

                    {cell.type === "text" && (
                      <Input
                        id={cellId}
                        aria-label={column.header}
                        value={cellValue}
                        disabled={readOnly}
                        onChange={(e) => update(row.id, column.id, e.target.value)}
                        className={cn("h-8", readOnly && "bg-muted")}
                      />
                    )}

                    {cell.type === "date" && (
                      <Input
                        id={cellId}
                        type="date"
                        aria-label={column.header}
                        value={cellValue}
                        disabled={readOnly}
                        onChange={(e) => update(row.id, column.id, e.target.value)}
                        className={cn("h-8", readOnly && "bg-muted")}
                      />
                    )}

                    {cell.type === "checkbox" && (
                      <div className="flex justify-center">
                        <Checkbox
                          id={cellId}
                          aria-label={column.header}
                          checked={cellValue === "true"}
                          disabled={readOnly}
                          onCheckedChange={(checked) =>
                            update(row.id, column.id, checked === true ? "true" : "")
                          }
                        />
                      </div>
                    )}

                    {cell.type === "preset" &&
                      (cellValue ? (
                        <span>{cellValue}</span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          {cell.presetField && presetPlaceholder
                            ? `[${presetPlaceholder(cell.presetField)}]`
                            : "—"}
                        </span>
                      ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
