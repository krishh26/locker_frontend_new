"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExportOptions {
  dataTypes: string[];
  startDate?: Date;
  endDate?: Date;
  format: string;
  includeDeleted: boolean;
}

const dataTypes = [
  { id: "users", label: "Users" },
  { id: "learners", label: "Learners" },
  { id: "courses", label: "Courses" },
  { id: "employers", label: "Employers" },
  { id: "forms", label: "Forms" },
  { id: "surveys", label: "Surveys" },
  { id: "audit_logs", label: "Audit Logs" },
];

export function ExportOptionsForm() {
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [format, setFormat] = useState("csv");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      toast.error("Please select at least one data type");
      return;
    }

    setIsExporting(true);
    try {
      // Placeholder - will trigger export API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Export started. You will be notified when it's ready.");
    } catch (error) {
      toast.error("Failed to start export");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDataTypeToggle = (dataType: string, checked: boolean) => {
    if (checked) {
      setSelectedDataTypes((prev) => [...prev, dataType]);
    } else {
      setSelectedDataTypes((prev) => prev.filter((type) => type !== dataType));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Select Data Types</h3>
        <div className="grid gap-3">
          {dataTypes.map((dataType) => (
            <div key={dataType.id} className="flex items-center space-x-2">
              <Checkbox
                id={dataType.id}
                checked={selectedDataTypes.includes(dataType.id)}
                onCheckedChange={(checked) =>
                  handleDataTypeToggle(dataType.id, checked as boolean)
                }
              />
              <Label htmlFor={dataType.id} className="cursor-pointer">
                {dataType.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Date Range (Optional)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Export Options</h3>
        <div className="grid gap-2">
          <Label htmlFor="format">Export Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="excel">Excel (XLSX)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include_deleted"
            checked={includeDeleted}
            onCheckedChange={(checked) => setIncludeDeleted(checked as boolean)}
          />
          <Label htmlFor="include_deleted" className="cursor-pointer">
            Include deleted records
          </Label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={isExporting || selectedDataTypes.length === 0}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Start Export
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
