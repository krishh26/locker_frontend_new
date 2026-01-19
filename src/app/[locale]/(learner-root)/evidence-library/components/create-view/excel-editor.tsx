"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExcelRow {
  [key: string]: string;
}

interface ExcelEditorProps {
  sheetName: string;
  setSheetName: (name: string) => void;
  excelData: ExcelRow[];
  setExcelData: (data: ExcelRow[]) => void;
  onSaveUpload: () => void;
  loading: boolean;
  disabled: boolean;
}

export function ExcelEditor({
  sheetName,
  setSheetName,
  excelData,
  setExcelData,
  onSaveUpload,
  loading,
  disabled,
}: ExcelEditorProps) {

  // Get current columns from existing data
  const getCurrentColumns = () => {
    if (excelData.length === 0) return ["A", "B", "C"];
    return Object.keys(excelData[0]);
  };

  const addRow = () => {
    const currentColumns = getCurrentColumns();
    const newRow: ExcelRow = {};
    currentColumns.forEach((col) => {
      newRow[col] = "";
    });
    setExcelData([...excelData, newRow]);
  };

  const addColumn = () => {
    const currentColumns = getCurrentColumns();
    const nextColIndex = currentColumns.length;
    if (nextColIndex < 26) {
      // Limit to A-Z
      const nextCol = String.fromCharCode(65 + nextColIndex);
      const newData = excelData.map((row) => ({
        ...row,
        [nextCol]: "",
      }));
      setExcelData(newData);
    }
  };

  const deleteRow = (rowIndex: number) => {
    if (excelData.length > 1) {
      const newData = excelData.filter((_, index) => index !== rowIndex);
      setExcelData(newData);
    }
  };

  const deleteColumn = (col: string) => {
    const currentColumns = getCurrentColumns();
    if (currentColumns.length > 1) {
      const newData = excelData.map((row) => {
        const newRow = { ...row };
        delete newRow[col];
        return newRow;
      });
      setExcelData(newData);
    }
  };

  const updateCell = (rowIndex: number, column: string, value: string) => {
    const newData = [...excelData];
    if (!newData[rowIndex]) {
      newData[rowIndex] = {};
    }
    newData[rowIndex][column] = value;
    setExcelData(newData);
  };

  const columns = getCurrentColumns();

  // Check if there's any data
  const hasData = excelData.some((row) =>
    Object.values(row).some((cell) => cell.trim() !== "")
  );

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Sheet Name */}
      <div className="space-y-2">
        <Label htmlFor="sheet-name">
          Sheet Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sheet-name"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          placeholder="Enter sheet name"
          disabled={disabled || loading}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled || loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addColumn}
          disabled={disabled || loading || columns.length >= 26}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 bg-muted/50"></TableHead>
              {columns.map((col) => (
                <TableHead key={col} className="bg-muted/50 min-w-[120px]">
                  <div className="flex items-center justify-between">
                    <span>{col}</span>
                    {columns.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => deleteColumn(col)}
                        disabled={disabled || loading}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {excelData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="bg-muted/50 w-12">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {rowIndex + 1}
                    </span>
                    {excelData.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => deleteRow(rowIndex)}
                        disabled={disabled || loading}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                {columns.map((col) => (
                  <TableCell key={col}>
                    <Input
                      value={row[col] || ""}
                      onChange={(e) =>
                        updateCell(rowIndex, col, e.target.value)
                      }
                      disabled={disabled || loading}
                      className="h-8"
                      placeholder=""
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSaveUpload}
          disabled={disabled || loading || !sheetName.trim() || !hasData}
        >
          {loading ? "Creating..." : "Create Spreadsheet"}
        </Button>
      </div>
    </div>
  );
}

