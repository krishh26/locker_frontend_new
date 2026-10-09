"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TableCell, TableCellType, TableConfig } from "@/store/api/forms/types";
import {
  createTableColumn,
  createTableRow,
  getTableCell,
} from "@/components/forms/table-utils";
import { PRESET_OPTION_GROUPS, usePresetLabel } from "@/components/forms/use-preset-label";

const CELL_TYPES: TableCellType[] = ["static", "text", "date", "checkbox", "preset"];

interface TableEditorProps {
  value: TableConfig;
  onChange: (value: TableConfig) => void;
}

export function TableEditor({ value, onChange }: TableEditorProps) {
  const t = useTranslations("forms.builder.tableEditor");
  const tRoles = useTranslations("forms.builder.presets.roles");
  const presetLabel = usePresetLabel();
  const { columns, rows } = value;

  const setCell = (rowId: string, columnId: string, cell: TableCell) => {
    onChange({
      ...value,
      rows: rows.map((row) =>
        row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: cell } } : row
      ),
    });
  };

  const setColumnType = (columnId: string, type: TableCellType) => {
    onChange({
      ...value,
      rows: rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [columnId]: { type } },
      })),
    });
  };

  const renameColumn = (columnId: string, header: string) => {
    onChange({
      ...value,
      columns: columns.map((c) => (c.id === columnId ? { ...c, header } : c)),
    });
  };

  const addColumn = () => {
    const column = createTableColumn(t("defaultColumn", { n: columns.length + 1 }));
    onChange({
      ...value,
      columns: [...columns, column],
      rows: rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [column.id]: { type: "text" } },
      })),
    });
  };

  const removeColumn = (columnId: string) => {
    onChange({
      ...value,
      columns: columns.filter((c) => c.id !== columnId),
      rows: rows.map((row) => {
        const cells = { ...row.cells };
        delete cells[columnId];
        return { ...row, cells };
      }),
    });
  };

  const addRow = () => {
    onChange({ ...value, rows: [...rows, createTableRow(columns)] });
  };

  const removeRow = (rowId: string) => {
    onChange({ ...value, rows: rows.filter((r) => r.id !== rowId) });
  };

  const renderCellEditor = (rowId: string, columnId: string, cell: TableCell) => (
    <div className="space-y-1.5">
      <Select
        value={cell.type}
        onValueChange={(type: TableCellType) => setCell(rowId, columnId, { type })}
      >
        <SelectTrigger size="sm" className="h-8 w-full" aria-label={t("cellType")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CELL_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`cellTypes.${type}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {cell.type === "static" && (
        <Input
          value={cell.text ?? ""}
          placeholder={t("staticPlaceholder")}
          onChange={(e) => setCell(rowId, columnId, { ...cell, text: e.target.value })}
          className="h-8"
        />
      )}

      {cell.type === "preset" && (
        <Select
          value={cell.presetField ?? ""}
          onValueChange={(presetField) => setCell(rowId, columnId, { ...cell, presetField })}
        >
          <SelectTrigger size="sm" className="h-8 w-full">
            <SelectValue placeholder={t("presetPlaceholder")}>
              {cell.presetField ? presetLabel(cell.presetField) : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRESET_OPTION_GROUPS.filter((g) => g.options.length > 0).map((group) => (
              <SelectGroup key={group.group}>
                <SelectLabel>{tRoles(group.group as "learner")}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem key={`${group.group}-${option.type}`} value={option.presetField}>
                    {presetLabel(option.presetField)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="table-show-header"
          checked={value.showHeader}
          onCheckedChange={(checked) => onChange({ ...value, showHeader: checked === true })}
        />
        <Label htmlFor="table-show-header">{t("showHeader")}</Label>
      </div>

      <p className="text-xs text-muted-foreground">{t("hint")}</p>

      <div className="overflow-x-auto rounded-md border">
        <table className="border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((column) => (
                <th key={column.id} className="min-w-48 border-b border-r p-2 align-top font-normal">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Input
                        value={column.header}
                        placeholder={t("columnHeader")}
                        onChange={(e) => renameColumn(column.id, e.target.value)}
                        className="h-8 font-medium"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 p-0 text-destructive hover:text-destructive"
                        disabled={columns.length <= 1}
                        onClick={() => removeColumn(column.id)}
                        aria-label={t("removeColumn")}
                        title={t("removeColumn")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Select value="" onValueChange={(type: TableCellType) => setColumnType(column.id, type)}>
                      <SelectTrigger size="sm" className="h-7 w-full text-xs">
                        <SelectValue placeholder={t("setWholeColumn")} />
                      </SelectTrigger>
                      <SelectContent>
                        {CELL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`cellTypes.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </th>
              ))}
              <th className="w-10 border-b p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.id} className="border-b border-r p-2 align-top">
                    {renderCellEditor(row.id, column.id, getTableCell(row, column.id))}
                  </td>
                ))}
                <td className="border-b p-2 align-top">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    disabled={rows.length <= 1}
                    onClick={() => removeRow(row.id)}
                    aria-label={t("removeRow")}
                    title={t("removeRow")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addRow")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addColumn}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addColumn")}
        </Button>
      </div>
    </div>
  );
}
