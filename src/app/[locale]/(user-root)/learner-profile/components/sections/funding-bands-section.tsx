"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LearnerData } from "@/store/api/learner/types";

interface FundingBandsSectionProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function FundingBandsSection({ learner, canEdit = false }: FundingBandsSectionProps) {
  const form = useFormContext();
  const customFundingData = learner.custom_funding_data;

  if (!customFundingData) {
    return null;
  }

  const formatDate = (date: string | undefined | null): string => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      return d.toLocaleDateString();
    } catch {
      return date;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Bands</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Original Amount</Label>
            {canEdit ? (
              <>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("original_amount", { valueAsNumber: true })}
                  
                />
                {form.formState.errors.original_amount && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.original_amount.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {customFundingData.original_amount ? `£${customFundingData.original_amount}` : "-"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Amount</Label>
            {canEdit ? (
              <>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("custom_amount", { valueAsNumber: true })}
                  
                />
                {form.formState.errors.custom_amount && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.custom_amount.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {customFundingData.custom_amount ? `£${customFundingData.custom_amount}` : "-"}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Funding Band ID</Label>
            {canEdit ? (
              <>
                <Input
                  type="number"
                  {...form.register("funding_band_id", { valueAsNumber: true })}
                  
                />
                {form.formState.errors.funding_band_id && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.funding_band_id.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {customFundingData.funding_band_id || "-"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Updated by Learner</Label>
            <div className="flex items-center">
              {customFundingData.updated_by_learner ? "Yes" : "No"}
            </div>
          </div>
        </div>

        {customFundingData.updated_at && (
          <div className="mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Updated</Label>
              <div className="flex items-center">
                {formatDate(customFundingData.updated_at)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

