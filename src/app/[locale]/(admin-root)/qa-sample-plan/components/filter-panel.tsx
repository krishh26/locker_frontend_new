"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { assessmentMethods, sampleTypes } from "../utils/constants";
import { Loader2 } from "lucide-react";
import {
  selectFilterState,
  toggleMethod,
  setSelectedMethods,
  setSampleType,
  setPlannedSampleDate,
} from "@/store/slices/qaSamplePlanSlice";

interface FilterPanelProps {
  onApplySamples: () => void;
  isApplySamplesDisabled: boolean;
  isApplySamplesLoading: boolean;
  onApplyRandomSamples: () => void;
  isApplyRandomSamplesLoading: boolean;
}

export function FilterPanel({
  onApplySamples,
  isApplySamplesDisabled,
  isApplySamplesLoading,
  onApplyRandomSamples,
  isApplyRandomSamplesLoading,
}: FilterPanelProps) {
  const dispatch = useAppDispatch();
  const filterState = useAppSelector(selectFilterState);
  const { selectedMethods, sampleType, plannedSampleDate } = filterState;
  const [dateError, setDateError] = useState<string>("");
  const allSelected = selectedMethods.length === assessmentMethods.length;

  const handleDateChange = (value: string) => {
    dispatch(setPlannedSampleDate(value));
    if (!value.trim()) {
      setDateError("Planned Sample Date is required");
    } else {
      setDateError("");
    }
  };

  const handleApplySamplesClick = () => {
    if (!plannedSampleDate.trim()) {
      setDateError("Planned Sample Date is required");
      return;
    }
    setDateError("");
    onApplySamples();
  };

  const handleApplyRandomSamplesClick = () => {
    if (!plannedSampleDate.trim()) {
      setDateError("Planned Sample Date is required");
      return;
    }
    setDateError("");
    onApplyRandomSamples();
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assessment Methods */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Assessment Methods</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    dispatch(setSelectedMethods(assessmentMethods.map((method) => method.code)));
                  } else {
                    dispatch(setSelectedMethods([]));
                  }
                }}
              />
              <Label
                htmlFor="select-all"
                className="text-sm font-semibold cursor-pointer"
              >
                Select All
              </Label>
            </div>
            {assessmentMethods.map((method) => (
              <div key={method.code} className="flex items-center space-x-2">
                <Checkbox
                  id={`method-${method.code}`}
                  checked={selectedMethods.includes(method.code)}
                  onCheckedChange={() => dispatch(toggleMethod(method.code))}
                />
                <Label
                  htmlFor={`method-${method.code}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {method.code} - {method.title}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Sample Type */}
        <div className="space-y-2">
          <Label htmlFor="sample-type" className="text-base font-semibold">
            Sample Type
          </Label>
          <Select value={sampleType || undefined} onValueChange={(value) => dispatch(setSampleType(value))}>
            <SelectTrigger className="w-full" id="sample-type">
              <SelectValue placeholder="Select sample type" />
            </SelectTrigger>
            <SelectContent>
              {sampleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Planned Sample Date */}
        <div className="space-y-2">
          <Label htmlFor="date-from" className="text-base font-semibold">
            Planned Sample Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date-from"
            type="date"
            value={plannedSampleDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
          {dateError && (
            <p className="text-sm text-destructive">{dateError}</p>
          )}
        </div>

        <Separator />

        {/* Apply Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleApplySamplesClick}
            disabled={isApplySamplesDisabled || isApplySamplesLoading}
            className="w-full"
          >
            {isApplySamplesLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Apply Samples
          </Button>
          <Button
            onClick={handleApplyRandomSamplesClick}
            disabled={isApplySamplesDisabled || isApplyRandomSamplesLoading}
            variant="outline"
            className="w-full"
          >
            {isApplyRandomSamplesLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Apply Random Samples
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

