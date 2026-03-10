"use client";

import { Save, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSaveCourseRiskRatingsMutation } from "@/store/api/trainer-risk-rating/trainerRiskRatingApi";
import { toast } from "sonner";
import type { Course, SaveCourseRiskRatingsRequest } from "@/store/api/trainer-risk-rating/types";

interface RiskSettingsSectionProps {
  riskSettings: { high: string; medium: string; low: string };
  riskSettingsErrors: { high: string; medium: string; low: string; general: string };
  onRiskSettingsChange: (settings: { high: string; medium: string; low: string }) => void;
  onRiskSettingsErrorsChange: (errors: { high: string; medium: string; low: string; general: string }) => void;
  trainerId: number;
  courses: Course[];
  courseRatings: { [key: number]: string };
  onSaveSuccess: () => void;
}

const getValidateRiskSettings = (t: ReturnType<typeof useTranslations<"trainerRiskRating.riskSettings">>) => (
  settings: { high: string; medium: string; low: string }
): { high: string; medium: string; low: string; general: string } => {
  const errors = { high: "", medium: "", low: "", general: "" };
  const highValue = parseFloat(settings.high) || 0;
  const mediumValue = parseFloat(settings.medium) || 0;
  const lowValue = parseFloat(settings.low) || 0;

  if (settings.high && (isNaN(highValue) || highValue < 0 || highValue > 100)) {
    errors.high = t("highRiskError");
  }
  if (settings.medium && (isNaN(mediumValue) || mediumValue < 0 || mediumValue > 100)) {
    errors.medium = t("mediumRiskError");
  }
  if (settings.low && (isNaN(lowValue) || lowValue < 0 || lowValue > 100)) {
    errors.low = t("lowRiskError");
  }
  if (highValue > 0 && (mediumValue > highValue || lowValue > highValue)) {
    errors.medium = mediumValue > highValue ? t("cannotExceedHigh", { value: highValue }) : "";
    errors.low = lowValue > highValue ? t("cannotExceedHigh", { value: highValue }) : "";
  }
  if (mediumValue > 0 && lowValue > mediumValue) {
    errors.low = t("cannotExceedMedium", { value: mediumValue });
  }

  return errors;
};

export function RiskSettingsSection({
  riskSettings,
  riskSettingsErrors,
  onRiskSettingsChange,
  onRiskSettingsErrorsChange,
  trainerId,
  courseRatings,
  onSaveSuccess,
}: RiskSettingsSectionProps) {
  const t = useTranslations("trainerRiskRating.riskSettings");
  const validateRiskSettings = getValidateRiskSettings(t);
  const [saveCourseRisk, { isLoading: savingSettings }] = useSaveCourseRiskRatingsMutation();

  const handleChange = (field: "high" | "medium" | "low", value: string) => {
    const newSettings = { ...riskSettings, [field]: value };
    onRiskSettingsChange(newSettings);
    const errors = validateRiskSettings(newSettings);
    onRiskSettingsErrorsChange(errors);
  };

  const handleSave = async () => {
    const errors = validateRiskSettings(riskSettings);
    onRiskSettingsErrorsChange(errors);
    
    const hasErrors = Object.values(errors).some((e) => e !== "");
    if (hasErrors) {
      toast.error(t("fixValidationErrors"));
      return;
    }

    const coursesData = Object.entries(courseRatings).map(([id, risk]) => ({
      course_id: Number(id),
      overall_risk_level: risk === "Please select" ? "" : risk,
    }));

    const payload: SaveCourseRiskRatingsRequest = {
      trainer_id: trainerId,
      high_percentage: Number(riskSettings.high),
      medium_percentage: Number(riskSettings.medium),
      low_percentage: Number(riskSettings.low),
      courses: coursesData,
    };

    try {
      await saveCourseRisk({ data: payload }).unwrap();
      toast.success(t("savedSuccess"));
      onSaveSuccess();
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1.5 bg-secondary">
            <Save className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-foreground">{t("title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 rounded-lg bg-destructive/10 p-3 border border-destructive/30">
            <Label htmlFor="high-risk" className="text-destructive font-semibold">{t("highRiskPercent")}</Label>
            <Input
              id="high-risk"
              type="number"
              min="0"
              max="100"
              value={riskSettings.high}
              onChange={(e) => handleChange("high", e.target.value)}
              aria-invalid={!!riskSettingsErrors.high}
            />
            {riskSettingsErrors.high && (
              <p className="text-sm text-destructive">{riskSettingsErrors.high}</p>
            )}
          </div>
          <div className="space-y-2 rounded-lg bg-secondary/10 p-3 border border-secondary/30">
            <Label htmlFor="medium-risk" className="text-secondary font-semibold">{t("mediumRiskPercent")}</Label>
            <Input
              id="medium-risk"
              type="number"
              min="0"
              max="100"
              value={riskSettings.medium}
              onChange={(e) => handleChange("medium", e.target.value)}
              aria-invalid={!!riskSettingsErrors.medium}
            />
            {riskSettingsErrors.medium && (
              <p className="text-sm text-destructive">{riskSettingsErrors.medium}</p>
            )}
          </div>
          <div className="space-y-2 rounded-lg bg-accent/10 p-3 border border-accent/30">
            <Label htmlFor="low-risk" className="text-accent font-semibold">{t("lowRiskPercent")}</Label>
            <Input
              id="low-risk"
              type="number"
              min="0"
              max="100"
              value={riskSettings.low}
              onChange={(e) => handleChange("low", e.target.value)}
              aria-invalid={!!riskSettingsErrors.low}
            />
            {riskSettingsErrors.low && (
              <p className="text-sm text-destructive">{riskSettingsErrors.low}</p>
            )}
          </div>
        </div>
        {riskSettingsErrors.general && (
          <p className="mt-4 text-sm text-destructive">{riskSettingsErrors.general}</p>
        )}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={savingSettings}>
            {savingSettings ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("saveSettings")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

