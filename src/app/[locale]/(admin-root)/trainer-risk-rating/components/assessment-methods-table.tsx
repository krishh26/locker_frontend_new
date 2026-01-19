"use client";

import { ClipboardList, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSaveCourseRiskRatingsMutation } from "@/store/api/trainer-risk-rating/trainerRiskRatingApi";
import type { SaveCourseRiskRatingsRequest } from "@/store/api/trainer-risk-rating/types";
import { toast } from "sonner";

interface AssessmentMethod {
  value: string;
  label: string;
  fullName: string;
}

interface AssessmentMethodsTableProps {
  assessmentMethods: readonly AssessmentMethod[];
  assessmentRiskRating: { [key: string]: string };
  riskOptions: Array<{ value: string; label: string; color?: string }>;
  onRatingChange: (ratings: { [key: string]: string }) => void;
  trainerId: number;
  onSaveSuccess: () => void;
}

export function AssessmentMethodsTable({
  assessmentMethods,
  assessmentRiskRating,
  riskOptions,
  onRatingChange,
  trainerId,
  onSaveSuccess,
}: AssessmentMethodsTableProps) {
  const [saveCourseRisk, { isLoading: savingCourseRisk }] = useSaveCourseRiskRatingsMutation();

  const handleRatingChange = (method: string, value: string) => {
    onRatingChange({ ...assessmentRiskRating, [method]: value });
  };

  const handleBulkSet = (value: string) => {
    const updated: { [key: string]: string } = {};
    assessmentMethods.forEach((method) => {
      updated[method.value] = value;
    });
    onRatingChange(updated);
    toast.success(`All assessment methods set to ${value} risk level`);
  };

  const handleSaveAssessmentRatings = async () => {
    const assessmentMethodsData = Object.entries(assessmentRiskRating).map(
      ([id, risk]) => ({
        assessment_method: id,
        risk_level: risk === "Please select" ? "" : risk,
      })
    );

    const payload: SaveCourseRiskRatingsRequest = {
      trainer_id: trainerId,
      assessment_methods: assessmentMethodsData,
    };

    try {
      await saveCourseRisk({ data: payload }).unwrap();
      toast.success("Assessment risk ratings saved successfully");
      onSaveSuccess();
    } catch {
      toast.error("Failed to save assessment risk ratings");
    }
  };

  const getRiskColor = (riskLevel: string) => {
    if (riskLevel === "Low") return "bg-green-100 text-green-800 border-green-200";
    if (riskLevel === "Medium") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (riskLevel === "High") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>Assessment Method Risk ({assessmentMethods.length})</CardTitle>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkSet("Low")}
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              Set All Low
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkSet("Medium")}
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            >
              Set All Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkSet("High")}
              className="border-red-500 text-red-700 hover:bg-red-50"
            >
              Set All High
            </Button>
            <Button
              onClick={handleSaveAssessmentRatings}
              disabled={savingCourseRisk}
              variant="secondary"
            >
              {savingCourseRisk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment Method</TableHead>
                <TableHead className="w-[30%]">Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentMethods.map((assessment) => {
                const currentRating =
                  assessmentRiskRating[assessment.value] || "Please select";

                return (
                  <TableRow key={assessment.value}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {assessment.label}
                        </Badge>
                        <span>{assessment.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentRating}
                        onValueChange={(value) =>
                          handleRatingChange(assessment.value, value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {riskOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <span>{opt.label}</span>
                                {opt.value !== "Please select" && opt.color && (
                                  <Badge
                                    variant="outline"
                                    className={getRiskColor(opt.label)}
                                  >
                                    {opt.label}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

